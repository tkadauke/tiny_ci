module TinyCI
  module Report
    class TestReport < TaskReport
      class Test
        attr_accessor :name
        attr_reader :test_cases
        
        def initialize(name)
          @name = name
          @test_cases = []
        end
      end
      
      class TestCase
        attr_accessor :name, :status, :duration
        attr_accessor :error_message, :backtrace
        
        def initialize(name, status)
          @name, @status = name, status
        end
        
        def error!(error_message, backtrace)
          self.error_message = error_message
          self.backtrace = backtrace
        end
      end
      
      class Summary
        attr_accessor :total_time, :tests, :assertions, :failures, :errors
      end
      
      attr_reader :tests
      
      def initialize
        @tests = {}
      end
      
      def add_test_case(test_name, test_case_name, status)
        @tests[test_name] ||= Test.new(test_name)
        test_case = TestCase.new(test_case_name, status)
        @tests[test_name].test_cases << test_case
        test_case
      end
      
      def test_case(test_name, test_case_name)
        @tests[test_name].test_cases.find { |test_case| test_case.name == test_case_name }
      end
      
      def summary
        @summary ||= Summary.new
      end
    end
  end
end
