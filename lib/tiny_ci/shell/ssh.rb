require 'net/ssh'

module TinyCI
  module Shell
    class SSH
      def initialize(build)
        @build = build
        @ssh = Net::SSH.start(build.slave.hostname, build.slave.username, :password => build.slave.password)
      end
      
      def run(command, parameters, working_dir, environment)
        output = ""
        cmdline = "#{command} #{[parameters].flatten.join(' ')}"
        channel = @ssh.open_channel do |ch|
          env = build_environment(environment)
          
          ch.exec %{/bin/bash -c 'cd #{working_dir}; #{env} #{cmdline} 2>&1'} do |ch, success|
            raise CommandExecutionFailed, "could not execute command" unless success
          
            ch.on_data do |c, data|
              output << data
              
              lines = output.split("\n")
              output = output[-1..-1] == "\n" ? "" : lines.pop
              @build.add_to_output(Time.now, command, lines) unless lines.blank?
            end
            
            ch.on_request("exit-status") do |ch, data|
              @build.flush_output!
              exit_code = data.read_long
              
              raise CommandExecutionFailed if exit_code > 0
            end
            
            ch.on_request("exit-signal") do |ch, data|
              @build.flush_output!
              raise CommandExecutionFailed
            end

            ch.on_close { @build.flush_output! }
          end
        end
        
        channel.wait
      end
      
      def exists?(path, working_dir)
        output = @ssh.exec!(%{cd #{working_dir}; if [ -e "#{path}" ]; then echo 1; else echo 0; fi})
        output.strip == '1'
      end
      
      def mkdir(path)
        run('mkdir', ["-p", path], '/', {})
      end
      
      def capture(command, working_dir)
        env = build_environment
        @ssh.exec! %{cd #{working_dir}; #{env} #{command}}
      end
      
    private
      def build_environment(environment = {})
        @build.current_environment.merge(environment).collect { |key, value| %{#{key}="#{value.gsub('"', '\\"')}"} }.join(' ')
      end
    end
  end
end
