require File.dirname(__FILE__) + '/../../../test_helper'

class TinyCI::Report::TestReportTest < ActiveSupport::TestCase
  test "should add test case" do
    report = TinyCI::Report::TestReport.new
    report.add_test_case('SomeTest', 'test_should_do_something', 'success')
    
    test_case = report.test_case('SomeTest', 'test_should_do_something')
    assert_equal 'success', test_case.status
  end
  
  test "should add error to test case" do
    report = TinyCI::Report::TestReport.new
    report.add_test_case('SomeTest', 'test_should_do_something', 'failure')
    
    test_case = report.test_case('SomeTest', 'test_should_do_something')
    test_case.error!('it failed!', caller)
    assert_equal 'it failed!', test_case.error_message
  end
  
  test "should provide access to test summary" do
    report = TinyCI::Report::TestReport.new
    assert report.summary.is_a?(TinyCI::Report::TestReport::Summary)
  end
end
