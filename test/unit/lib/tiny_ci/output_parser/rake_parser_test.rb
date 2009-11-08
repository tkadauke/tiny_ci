require File.dirname(__FILE__) + '/../../../test_helper'

class TinyCI::OutputParser::RakeParserTest < ActiveSupport::TestCase
  test "should return build report" do
    output = TinyCI::Output.new('')
    result = TinyCI::OutputParser::RakeParser.parse(output)
    assert result.is_a?(TinyCI::Report::BuildReport)
  end
  
  test "should delegate parsing to sub task parser" do
    output = TinyCI::Output.new("1,rake,** Execute sub:task\n2,rake,some output")
    parser = TinyCI::OutputParser::RakeParser.new(output)
    TinyCI::OutputParser::RakeTaskParser.expects(:parse).with(output).returns(stub(:name=))
    parser.parse!
  end
  
  test "should delegate parsing to test task parser" do
    output = TinyCI::Output.new("1,rake,** Execute test:units\n2,rake,some test output")
    parser = TinyCI::OutputParser::RakeParser.new(output)
    TinyCI::OutputParser::RakeTestParser.expects(:parse).with(output).returns(stub(:name=))
    parser.parse!
  end
end
