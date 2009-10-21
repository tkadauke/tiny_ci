module SimpleCI
  module Connection
    class Localhost
      def run(command, parameters, working_dir, environment)
        cmdline = "#{command} #{[parameters].flatten.join(' ')}"
        puts cmdline
        Dir.chdir(working_dir) do
          environment.each do |key, value|
            ENV[key] = value
          end
          
          system cmdline
          raise(CommandExecutionFailed) unless $? == 0
        end
      end
      
      def exists?(path, working_dir)
        Dir.chdir(working_dir) do
          File.exists?(path)
        end
      end
    end
  end
end
