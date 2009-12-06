module TinyCI
  module OutputParser
    def self.parser_for(command)
      case command
      when 'rake' then RakeParser
      when 'cap' then CapistranoParser
      end
    end
    
    class Base
      def self.parse(output)
        parser = new(output)
        parser.parse!
        parser.result.raw_output = parser.consumed_output
        parser.result
      end
      
      attr_reader :result
      
      def initialize(output)
        @output = output
      end
      
      delegate :peek, :empty?, :to => "@output"
      
      def parse!
        raise NotImplementedError
      end
      
      def consume!
        returning @output.consume! do |output_line|
          consumed_output << output_line
        end
      end
      
      def consumed_output
        @consumed_output ||= []
      end
    end
  end
end
