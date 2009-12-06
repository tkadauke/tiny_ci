require File.expand_path(File.dirname(__FILE__) + '/../../../test_helper')

class TinyCI::OutputParser::CapistranoTaskParserTest < ActiveSupport::TestCase
  test "should parse until eof" do
    output = TinyCI::Output.new('1,cap,some output')
    result = TinyCI::OutputParser::CapistranoTaskParser.parse(output)
    assert_equal 'some output', result.raw_output.first.line
    assert_equal 1, result.raw_output.size
  end
  
  test "should break when a new task is invoked" do
    output = TinyCI::Output.new("1,cap,some output\n2,cap,  * executing `task'")
    result = TinyCI::OutputParser::CapistranoTaskParser.parse(output)
    assert_equal 1, result.raw_output.size
  end
  
  test "should delegate to command parser when command is executed" do
    output = TinyCI::Output.new("1,rake,some output\n2,rake,\"  * executing \"\"some_shell_command with parameters\"\"\"")
    TinyCI::OutputParser::CapistranoCommandParser.expects(:parse).with(output).returns(TinyCI::Report::DeployCommandReport.new)
    result = TinyCI::OutputParser::CapistranoTaskParser.parse(output)
    assert_equal 2, result.raw_output.size
    assert_equal "some_shell_command with parameters", result.commands.first.command
  end
end
