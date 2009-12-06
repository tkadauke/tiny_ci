require File.dirname(__FILE__) + '/../../../test_helper'

class TinyCI::Report::DeployTaskReportTest < ActiveSupport::TestCase
  test "should initialize commands accessor" do
    report = TinyCI::Report::DeployTaskReport.new
    assert_equal [], report.commands
  end
end
