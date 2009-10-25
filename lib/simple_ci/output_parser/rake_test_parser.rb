module SimpleCI
  module OutputParser
    class RakeTestParser < Base
      STATUSES = { '.' => 'success', 'F' => 'failure', 'E' => 'error' }
      
      def parse!
        @result = SimpleCI::Report::TestReport.new
        
        last_test = last_timestamp = nil
        while !empty? && peek.line !~ /\*\* (Execute|Invoke)/
          row = consume!
          if last_test && last_timestamp
            last_test.duration = row.timestamp - last_timestamp
            last_test = last_timestamp = nil
          end
          
          line = row.line
          
          if line =~ /(test_[a-zA-Z0-9\_]*)\((.*?)\):\s+([\.FE])/
            test_case_name, test_name, status = $1, $2, STATUSES[$3]
            last_test = @result.add_test_case(test_name, test_case_name, status)
            last_timestamp = row.timestamp
          elsif line =~ /Finished in (.*?) seconds./
            @result.summary.total_time = $1
          elsif line =~ /(\d+) tests, (\d+) assertions, (\d+) failures, (\d+) errors/
            @result.summary.tests = $1
            @result.summary.assertions = $2
            @result.summary.failures = $3
            @result.summary.errors = $4
          end
        end
      end
    end
  end
end
