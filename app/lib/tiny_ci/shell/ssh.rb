require "net/ssh"

module TinyCI
  module Shell
    class SSH
      # See Shell::Localhost::STOP_CHECK_INTERVAL — same trade-off applies.
      STOP_CHECK_INTERVAL = 1.0

      def initialize(build)
        @build = build
        @ssh = Net::SSH.start(build.slave.hostname, build.slave.username, password: build.slave.password)
      end

      def run(command, parameters, working_dir, environment)
        output = ""
        cmdline = "#{command} #{[parameters].flatten.join(' ')}"
        last_stop_check = Time.now
        channel = @ssh.open_channel do |ch|
          env = build_environment(environment)

          ch.exec %{/bin/bash -c 'cd #{working_dir}; #{env} #{cmdline} 2>&1'} do |c, success|
            raise CommandExecutionFailed, "could not execute command" unless success

            c.on_data do |_, data|
              output << data

              lines = output.split("\n")
              output = output[-1..] == "\n" ? "" : lines.pop
              @build.add_to_output(Time.now, command, lines) unless lines.blank?

              if Time.now - last_stop_check >= STOP_CHECK_INTERVAL
                check_for_stop!
                last_stop_check = Time.now
              end
            end

            c.on_request("exit-status") do |_, data|
              @build.flush_output!
              exit_code = data.read_long

              raise CommandExecutionFailed if exit_code.positive?
            end

            c.on_request("exit-signal") do |_, _data|
              @build.flush_output!
              raise CommandExecutionFailed
            end

            c.on_close { @build.flush_output! }
          end
        end

        channel.wait
      end

      def exists?(path, working_dir)
        output = @ssh.exec!(%{cd #{working_dir}; if [ -e "#{path}" ]; then echo 1; else echo 0; fi})
        output.strip == "1"
      end

      def mkdir(path)
        run("mkdir", ["-p", path], "/", {})
      end

      def capture(command, working_dir)
        env = build_environment
        @ssh.exec! %{cd #{working_dir}; #{env} #{command}}
      end

      private

      def check_for_stop!
        @build.reload
        raise TinyCI::BuildStopped if @build.status == "stopping"
      rescue ActiveRecord::RecordNotFound
        raise TinyCI::BuildStopped
      end

      def build_environment(environment = {})
        @build.current_environment.merge(environment).collect { |key, value|
          %{#{key}="#{value.gsub('"', '\\"')}"}
        }.join(" ")
      end
    end
  end
end
