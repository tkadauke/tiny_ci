require File.dirname(__FILE__) + '/../../test_helper'

class TinyCI::OutputTest < ActiveSupport::TestCase
  test "should be empty if input string is empty" do
    assert TinyCI::Output.new("").empty?
  end
  
  test "should parse output" do
    output = TinyCI::Output.new("1,cmd,some output\n2,cmd,more output")
    lines = output.collect
    assert_equal 'cmd', lines.first.command
    assert_equal 'some output', lines.first.line
    assert_equal 'more output', lines.last.line
  end
  
  test "should parse time stamp" do
    output = TinyCI::Output.new("#{Time.now.to_f},cmd,some output\n2,cmd,more output")
    assert output.peek.timestamp.is_a?(Time)
  end
  
  test "should peek one line ahead" do
    output = TinyCI::Output.new("1,cmd,some output\n2,cmd,more output")
    assert_equal 'some output', output.peek.line
  end
  
  test "should consume line" do
    output = TinyCI::Output.new("1,cmd,some output\n2,cmd,more output")
    output.consume!
    assert_equal 'more output', output.peek.line
  end
  
  test "should split empty output by command" do
    output = TinyCI::Output.new("")
    assert_equal [], output.split_by_command
  end
  
  test "should split one one-lined output" do
    output = TinyCI::Output.new("1,cmd,some output")
    split = output.split_by_command
    assert_equal 1, split.size
  end
  
  test "should split two one-lined outputs" do
    output = TinyCI::Output.new("1,cmd,some output\n2,other_cmd,more output")
    split = output.split_by_command
    assert_equal 2, split.size
  end
  
  test "should split more than two one-lined outputs" do
    output = TinyCI::Output.new("1,cmd,some output\n2,other_cmd,more output\n3,yet_another_cmd,even more output")
    split = output.split_by_command
    assert_equal 3, split.size
  end
  
  test "should split multi-lined output" do
    output = TinyCI::Output.new("1,cmd,some output\n2,other_cmd,more output\n3,other_cmd,second line of more output\n4,other_cmd,third line of more output\n5,yet_another_cmd,even more output")
    split = output.split_by_command
    assert_equal 3, split.size
    assert_equal "more output", split[1].consume!.line
    assert_equal "second line of more output", split[1].consume!.line
  end
end
