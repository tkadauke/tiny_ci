module TinyCI
  module OutputParser
    class CapistranoTaskParser < Base
      def parse!
        @result = TinyCI::Report::DeployTaskReport.new
        
        while !empty?
          line = peek.line
          
          if line =~ /^\s*\* executing \"(.*)\"$/
            consume!
            command = CapistranoCommandParser.parse(@output)
            @result.commands << command
            command.command = $1
          elsif line =~ /^\s*\* executing `(.*?)'$/
            return
          else
            consume!
          end
        end
      end
    end
  end
end
