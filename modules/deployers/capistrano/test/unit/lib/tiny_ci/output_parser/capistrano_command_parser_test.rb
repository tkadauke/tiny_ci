require File.expand_path(File.dirname(__FILE__) + '/../../../test_helper')

class TinyCI::OutputParser::CapistranoCommandParserTest < ActiveSupport::TestCase
  test "should parse until eof" do
    output = TinyCI::Output.new('1,cap,some output')
    result = TinyCI::OutputParser::CapistranoCommandParser.parse(output)
    assert_equal 'some output', result.raw_output.first.line
    assert_equal 1, result.raw_output.size
  end
  
  test "should break when command is finished" do
    output = TinyCI::Output.new("1,cap,some output\n2,cap,command finished\n3,cap,some more output")
    result = TinyCI::OutputParser::CapistranoCommandParser.parse(output)
    assert_equal 2, result.raw_output.size
  end
  
  test "should parse server name first form of output line" do
    output = TinyCI::Output.new("1,cap, ** [example.com :: out] some output\n2,cap, ** [example.com :: out] some more output")
    result = TinyCI::OutputParser::CapistranoCommandParser.parse(output)
    assert_equal 2, result.output['example.com'].lines.size
  end

  test "should parse server name last form of output line" do
    output = TinyCI::Output.new("1,cap, ** [out :: example.com] some output\n2,cap, ** [out :: example.com] some more output")
    result = TinyCI::OutputParser::CapistranoCommandParser.parse(output)
    assert_equal 2, result.output['example.com'].lines.size
  end

  test "should parse output only form of output line" do
    output = TinyCI::Output.new("1,cap, ** [out :: example.com] some output\n2,cap, ** some more output")
    result = TinyCI::OutputParser::CapistranoCommandParser.parse(output)
    assert_equal 2, result.output['example.com'].lines.size
  end
  
  test "should split output from different servers" do
    output = TinyCI::Output.new("1,cap, ** [example.com :: out] some output\n2,cap, ** [foo.com :: out] some more output")
    result = TinyCI::OutputParser::CapistranoCommandParser.parse(output)
    assert_equal 1, result.output['example.com'].lines.size
    assert_equal 1, result.output['foo.com'].lines.size
  end
end
