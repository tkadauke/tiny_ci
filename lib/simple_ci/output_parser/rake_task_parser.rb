module SimpleCI
  module OutputParser
    class RakeTaskParser < Base
      STATUSES = { '.' => 'success', 'F' => 'failure', 'E' => 'error' }
      
      def parse!
        @result = SimpleCI::Report::TaskReport.new
        
        while !empty? && peek.line !~ /\*\* (Execute|Invoke)/
          consume!.line
        end
      end
    end
  end
end
