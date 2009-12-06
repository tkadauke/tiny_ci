module TinyCI
  class Output
    include Enumerable
    
    class OutputLine
      attr_accessor :timestamp, :command, :line
      
      def initialize(timestamp, command, line)
        @timestamp, @command, @line = Time.at(timestamp.to_f), command, line
      end
    end
    
    def initialize(output_string_or_array)
      if output_string_or_array.is_a?(String)
        @output = []
        FasterCSV.parse(output_string_or_array || "") { |timestamp, command, line| @output << OutputLine.new(timestamp, command, line) }
      else
        @output = output_string_or_array
      end
    end
    
    def consume!
      @output.shift
    end
    
    def peek
      @output.first
    end
    
    def split_by_command
      return [] if @output.empty?
      
      outputs = []
      lines = []
      current_command = @output.first.command
      @output.each do |line|
        if current_command != line.command
          current_command = line.command
          outputs << Output.new(lines)
          lines = []
        end
        
        lines << line
      end
      
      outputs << Output.new(lines) unless lines.empty?
      outputs
    end
    
    delegate :each, :empty?, :to => "@output"
  end
end
