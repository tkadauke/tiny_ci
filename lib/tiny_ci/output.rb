module TinyCI
  class Output
    include Enumerable
    
    class OutputLine
      attr_accessor :timestamp, :command, :line
      
      def initialize(timestamp, command, line)
        @timestamp, @command, @line = Time.at(timestamp.to_f), command, line
      end
    end
    
    def initialize(output_string)
      @output = []
      FasterCSV.parse(output_string || "") { |timestamp, command, line| @output << OutputLine.new(timestamp, command, line) }
    end
    
    def consume!
      @output.shift
    end
    
    def peek
      @output.first
    end
    
    delegate :each, :empty?, :to => "@output"
  end
end
