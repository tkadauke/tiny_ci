module TinyCI
  module OutputParser
    class CapistranoTaskParser < Base
      def parse!
        @result = TinyCI::Report::DeployTaskReport.new
        
        while !empty?
          line = peek.line
          
          if line =~ /^  \* executing \"(.*)\"$/
            consume!
            command = CapistranoCommandParser.parse(@output)
            @result.commands << command
            command.command = $1
          elsif line =~ /^  \* executing `(.*?)'$/
            return
          else
            consume!
          end
        end
      end
    end
  end
end
