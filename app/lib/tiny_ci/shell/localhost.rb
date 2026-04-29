require "fileutils"

module TinyCI
  module Shell
    class Localhost
      def initialize(build)
        @build = build
      end

      def run(command, parameters, working_dir, environment)
        cmdline = "#{command} #{[parameters].flatten.join(' ')} 2>&1"
        env = { "RAILS_ENV" => "development" }
              .merge(@build.current_environment)
              .merge(environment)
        env = stringify_env(env)

        Dir.chdir(working_dir) do
          IO.popen([env, "sh", "-c", cmdline]) do |stdout|
            until stdout.eof?
              line = stdout.gets
              @build.add_to_output(Time.now, command, line) if line
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
