module SimpleCI
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
        
        def initialize(name, status)
          @name, @status = name, status
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
      
      def summary
        @summary ||= Summary.new
      end
    end
  end
end
