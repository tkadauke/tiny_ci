require File.dirname(__FILE__) + '/../../../test_helper'

class TinyCI::OutputParser::RakeTaskParserTest < ActiveSupport::TestCase
  test "should parse until eof" do
    output = TinyCI::Output.new('1,rake,some output')
    result = TinyCI::OutputParser::RakeTaskParser.parse(output)
    assert_equal 'some output', result.raw_output.first.line
    assert_equal 1, result.raw_output.size
  end
  
  test "should break when a new task is invoked" do
    output = TinyCI::Output.new("1,rake,some output\n2,rake,** Invoke some:task")
    result = TinyCI::OutputParser::RakeTaskParser.parse(output)
    assert_equal 1, result.raw_output.size
  end
  
  test "should break when a new task is executed" do
    output = TinyCI::Output.new("1,rake,some output\n2,rake,** Execute some:task")
    result = TinyCI::OutputParser::RakeTaskParser.parse(output)
    assert_equal 1, result.raw_output.size
  end
end
