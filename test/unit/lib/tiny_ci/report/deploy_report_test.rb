require File.dirname(__FILE__) + '/../../../test_helper'

class TinyCI::Report::DeployReportTest < ActiveSupport::TestCase
  test "should initialize task accessor" do
    report = TinyCI::Report::DeployReport.new
    assert_equal [], report.tasks
  end
end
