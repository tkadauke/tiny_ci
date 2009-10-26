require File.dirname(__FILE__) + '/../test_helper'

class BuildsHelperTest < ActionView::TestCase
  class TestReport
  end
  
  test "should render report if template is available" do
    report = TestReport.new
    expects(:render).with(has_entry(:locals => { :report => report })).returns('result')
    assert_equal 'result', render_report(report, :details)
  end
  
  test "should return empty string if template is missing" do
    report = TestReport.new
    expects(:render).raises(ActionView::MissingTemplate.new(['paths'], 'path'))
    assert_equal '', render_report(report, :details)
  end
end
