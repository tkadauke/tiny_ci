module SimpleCI
  module OutputParser
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