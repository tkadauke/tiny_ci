module SimpleCI
  module Shell
    def self.open(build)
      klass = for_protocol(build.slave.protocol)
      klass.new(build)
    end
    
    def self.for_protocol(protocol)
      case protocol
      when 'localhost' then Localhost
      when 'ssh' then SSH
      end
    end
    
    class Localhost
      def initialize(build)
        @build = build
      end
      
      def run(command, parameters, working_dir, environment)
        cmdline = "#{command} #{[parameters].flatten.join(' ')}"
        puts cmdline
        Dir.chdir(working_dir) do
          environment.each do |key, value|
            ENV[key] = value
          end
          
          IO.popen("#{cmdline} 2>&1") do |stdout|
            output = []
            while !stdout.eof?
              if line = stdout.gets
                @build.add_to_output(Time.now, command, line)
              end
            end
            @build.flush_output!
          end
          
          raise(CommandExecutionFailed) unless $? == 0
        end
      end
      
      def exists?(path, working_dir)
        Dir.chdir(working_dir) do
          File.exists?(path)
        end
      end
      
      def mkdir(path)
        FileUtils.mkdir_p(path)
      end
    end
  end
end
