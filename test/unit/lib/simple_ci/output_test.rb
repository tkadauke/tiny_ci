require File.dirname(__FILE__) + '/../../test_helper'

class SimpleCI::OutputTest < ActiveSupport::TestCase
  test "should be empty if input string is empty" do
    assert SimpleCI::Output.new("").empty?
  end
  
  test "should parse output" do
    output = SimpleCI::Output.new("1,cmd,some output\n2,cmd,more output")
    lines = output.collect
    assert_equal 'cmd', lines.first.command
    assert_equal 'some output', lines.first.line
    assert_equal 'more output', lines.last.line
  end
  
  test "should parse time stamp" do
    output = SimpleCI::Output.new("#{Time.now.to_f},cmd,some output\n2,cmd,more output")
    assert output.peek.timestamp.is_a?(Time)
  end
  
  test "should peek one line ahead" do
    output = SimpleCI::Output.new("1,cmd,some output\n2,cmd,more output")
    assert_equal 'some output', output.peek.line
  end
  
  test "should consume line" do
    output = SimpleCI::Output.new("1,cmd,some output\n2,cmd,more output")
    output.consume!
    assert_equal 'more output', output.peek.line
  end
end
