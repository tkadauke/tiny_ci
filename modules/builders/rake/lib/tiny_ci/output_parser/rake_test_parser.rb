module TinyCI
  module OutputParser
    class RakeTestParser < Base
      STATUSES = { '.' => 'success', 'F' => 'failure', 'E' => 'error' }
      
      def parse!
        @result = TinyCI::Report::TestReport.new
        
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
          elsif line =~ /^\d+\) (Error|Failure):$/
            if $1 == 'Error'
              parse_error!
            else
              parse_failure!
            end
          end
        end
      end
      
      def parse_error!
        row = consume!
        line = row.line
        
        if line =~ /(test_[a-zA-Z0-9\_]*)\((.*?)\)/
          test_name, test_case_name = $2, $1
          error_message = consume!.line
          
          backtrace = []
          while !empty? && !peek.line.empty?
            backtrace << consume!.line.split(':')
          end
          test_case = @result.test_case(test_name, test_case_name)
          test_case.error!(error_message, backtrace) if test_case
        end
      end
      
      def parse_failure!
        row = consume!
        line = row.line
        
        if line =~ /(test_[a-zA-Z0-9\_]*)\((.*?)\)/
          test_name, test_case_name = $2, $1
          
          backtrace = []
          while !empty? && !peek.line.empty?
            line = consume!.line
            backtrace << line.gsub(/^\[/, '').gsub(/\]:$/, '').split(':')
            break if line =~ /\]:$/
          end

          error_message = []
          while !empty? && !peek.line.empty?
            error_message << consume!.line
          end
          
          test_case = @result.test_case(test_name, test_case_name)
          test_case.error!(error_message.join(' '), backtrace) if test_case
        end
      end
    end
  end
end
