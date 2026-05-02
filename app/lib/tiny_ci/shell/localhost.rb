require "fileutils"

module TinyCI
  module Shell
    class Localhost
      def initialize(build)
        @build = build
      end

      # Polling interval for cooperative stop checks. Reloading the build
      # from the DB on every output line would be a perf disaster; once a
      # second is responsive enough for a UI stop button without hammering
      # the DB on chatty builds.
      STOP_CHECK_INTERVAL = 1.0

      def run(command, parameters, working_dir, environment)
        cmdline = "#{command} #{[parameters].flatten.join(' ')} 2>&1"
        env = { "RAILS_ENV" => "development" }
              .merge(@build.current_environment)
              .merge(environment)
        env = stringify_env(env)

        Dir.chdir(working_dir) do
          IO.popen([env, "sh", "-c", cmdline]) do |stdout|
            last_stop_check = Time.now
            until stdout.eof?
              line = stdout.gets
              @build.add_to_output(Time.now, command, line) if line

              if Time.now - last_stop_check >= STOP_CHECK_INTERVAL
                check_for_stop!
                last_stop_check = Time.now
              end
            end
            @build.flush_output!
          end

          raise(CommandExecutionFailed) unless success?
        end
      end

      def exists?(path, working_dir)
        return false unless File.exist?(working_dir)

        Dir.chdir(working_dir) do
          File.exist?(path)
        end
      end

      def mkdir(path)
        FileUtils.mkdir_p(path)
      end

      def capture(command, working_dir)
        Dir.chdir(working_dir) do
          `#{command}`
        end
      end

      private

      def success?
        $?.success?
      end

      def check_for_stop!
        @build.reload
        raise TinyCI::BuildStopped if @build.status == "stopping"
      rescue ActiveRecord::RecordNotFound
        # Build row was deleted from under us — treat that the same as a stop
        # so the shell loop bails out instead of NoMethodError on next reload.
        raise TinyCI::BuildStopped
      end

      # IO.popen accepts a String=>String/nil hash as its first arg; nil
      # values unset the variable in the child env. Coerce values to strings
      # (or leave them nil) so the kernel call doesn't trip on a Symbol /
      # Integer / etc.
      def stringify_env(env)
        env.each_with_object({}) do |(k, v), out|
          out[k.to_s] = v.nil? ? nil : v.to_s
        end
      end
    end
  end
end
