require File.expand_path(File.dirname(__FILE__) + '/../../../test_helper')

class TinyCI::OutputParser::CapistranoParserTest < ActiveSupport::TestCase
  test "should return deploy report" do
    output = TinyCI::Output.new('')
    result = TinyCI::OutputParser::CapistranoParser.parse(output)
    assert result.is_a?(TinyCI::Report::DeployReport)
  end
  
  test "should delegate parsing to sub task parser" do
    output = TinyCI::Output.new("1,cap,  * executing `task'\n2,cap,some output")
    parser = TinyCI::OutputParser::CapistranoParser.new(output)
    TinyCI::OutputParser::CapistranoTaskParser.expects(:parse).with(output).returns(stub(:name=))
    parser.parse!
  end
end
