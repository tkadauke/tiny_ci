require 'net/ssh'

module SimpleCI
  module Shell
    class SSH
      def initialize(build)
        @build = build
        @ssh = Net::SSH.start('localhost', 'username', :password => "password")
      end
      
      def run(command, parameters, working_dir, environment)
        output = ""
        cmdline = "#{command} #{[parameters].flatten.join(' ')}"
        channel = @ssh.open_channel do |ch|
          environment.merge(ENV).each do |key, value|
            ch.env key, value
          end
          
          env = environment.merge(ENV).reject { |key, value| key == 'PS1' || key == 'EDITOR' || key =~ /TM/ }.collect { |key, value| %{#{key}="#{value.gsub('"', '\\"')}"} }.join(' ')
          
          ch.exec %{cd #{working_dir}; sh -c '#{env} #{cmdline} 2>&1'} do |ch, success|
            raise CommandExecutionFailed, "could not execute command" unless success
          
            ch.on_data do |c, data|
              output << data
              
              lines = output.split("\n")
              output = output[-1..-1] == "\n" ? "" : lines.pop
              @build.add_to_output(Time.now, command, lines) unless lines.blank?
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
    end
  end
end
