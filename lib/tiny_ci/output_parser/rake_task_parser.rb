module TinyCI
  module OutputParser
    class RakeTaskParser < Base
      def parse!
        @result = TinyCI::Report::TaskReport.new
        
        while !empty? && peek.line !~ /\*\* (Execute|Invoke)/
          consume!
        end
      end
    end
  end
end
