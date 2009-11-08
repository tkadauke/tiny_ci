module TinyCI
  module Shell
    class Localhost
      def initialize(build)
        @build = build
      end
      
      def run(command, parameters, working_dir, environment)
        cmdline = "#{command} #{[parameters].flatten.join(' ')}"
        Dir.chdir(working_dir) do
          @build.current_environment.merge(environment).each do |key, value|
            ENV[key] = value
          end
          
          IO.popen("sh -c '#{cmdline} 2>&1'") do |stdout|
            output = []
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
        $? == 0
      end
    end
  end
end
