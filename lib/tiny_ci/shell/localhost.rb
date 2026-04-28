require 'shellwords'

module TinyCI
  module Shell
    class Localhost
      def initialize(build)
        @build = build
      end

      def run(command, parameters, working_dir, environment)
        Dir.chdir(working_dir) do
          env = { 'RAILS_ENV' => 'development' }.merge(@build.current_environment.merge(environment))
          env_for_popen = env.transform_values { |v| v.to_s }

          IO.popen(env_for_popen, [command, *Array(parameters)], err: [:child, :out]) do |stdout|
            while !stdout.eof?
              if line = stdout.gets
                @build.add_to_output(Time.now, command, line)
              end
            end
            @build.flush_output!
          end

          raise(CommandExecutionFailed) unless success?
        end
      end

      def exists?(path, working_dir)
        return false unless File.exists?(working_dir)

        Dir.chdir(working_dir) do
          File.exists?(path)
        end
      end

      def mkdir(path)
        FileUtils.mkdir_p(path)
      end

      def capture(command, working_dir)
        Dir.chdir(working_dir) do
          %x{#{command}}
        end
      end

    private
      def success?
        $?.success?
      end

      def build_environment(environment = {})
        @build.current_environment.merge(environment).collect { |key, value| "#{key}=#{Shellwords.escape(value.to_s)}" }.join(' ')
      end
    end
  end
end
