require File.dirname(__FILE__) + '/../test_helper'

class BuildsHelperTest < ActionView::TestCase
  class TestReport
  end
  
  def setup
    stubs(:protect_against_forgery?).returns(false)
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
  
  test "should render ajax stop link" do
    html = stop_link(stub(:id => 27), stub(:id => 13), stub(:id => 7))
    assert html =~ /<a href="#"/
    assert html =~ /Ajax.Request/
    assert html =~ /<img/
  end
  
  test "should include image in stop link" do
    html = stop_link(stub(:id => 27), stub(:id => 13), stub(:id => 7))
    assert html =~ /stopped.png/
  end
  
  test "should include spinner image in stop link" do
    html = stop_link(stub(:id => 27), stub(:id => 13), stub(:id => 7))
    assert html =~ /spinner.gif/
  end
end
