require File.dirname(__FILE__) + '/../../../test_helper'

class TinyCI::Report::DeployCommandReportTest < ActiveSupport::TestCase
  test "should add output per server" do
    report = TinyCI::Report::DeployCommandReport.new
    assert report.output['some_server'].is_a?(TinyCI::Report::DeployCommandReport::Output)
  end
  
  test "should find servers" do
    report = TinyCI::Report::DeployCommandReport.new
    report.output['one_server'].lines
    report.output['another_server'].lines
    assert_equal ['another_server', 'one_server'], report.servers
  end
  
  test "should add line to output" do
    report = TinyCI::Report::DeployCommandReport.new
    report.output['one_server'].add_line('stdout', 'This is some output')
    assert_equal ['This is some output'], report.output['one_server'].lines.collect(&:string)
  end
end
