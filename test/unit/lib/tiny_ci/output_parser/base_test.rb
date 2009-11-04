require File.dirname(__FILE__) + '/../../../test_helper'

class TinyCI::OutputParser::BaseTest < ActiveSupport::TestCase
  class TestParser < TinyCI::OutputParser::Base
    def parse!
      @result = TestReport.new
      consume!
    end
  end
  
  class TestReport
    attr_accessor :raw_output
  end
  
  test "should keep track of consumed output" do
    output = stub(:consume! => 'some output')
    parser = TinyCI::OutputParser::Base.new(output)
    assert_equal [], parser.consumed_output
    parser.consume!
    assert_equal ['some output'], parser.consumed_output
  end
  
  test "should assign raw output to report object" do
    output = stub(:consume! => 'some output')
    result = TestParser.parse(output)
    assert_equal ['some output'], result.raw_output
  end
  
  test "should need a parse! method implemented" do
    assert_raise NotImplementedError do
      parser = TinyCI::OutputParser::Base.new(stub)
      parser.parse!
    end
  end
end
