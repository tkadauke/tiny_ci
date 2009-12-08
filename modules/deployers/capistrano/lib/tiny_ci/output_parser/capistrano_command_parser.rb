module TinyCI
  module OutputParser
    class CapistranoCommandParser < Base
      def parse!
        @result = TinyCI::Report::DeployCommandReport.new
        
        last_server = nil
        last_channel = nil
        
        while !empty?
          line = consume!.line
          
          if line =~ /^\s*\*\* \[(.*?) :: (out|err)\] (.*)$/
            last_server = $1
            last_channel = $2
            @result.output[last_server].add_line(last_channel, $3)
          elsif line =~ /^\s*\*\* \[(out|err) :: (.*?)\] (.*)$/
            last_channel = $1
            last_server = $2
            @result.output[last_server].add_line(last_channel, $3)
          elsif line =~ /^\s*\*\* (.*)$/
            @result.output[last_server].add_line(last_channel, $1)
          elsif line =~ /command finished/
            return
          end
        end
      end
    end
  end
end
