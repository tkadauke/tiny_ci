require File.dirname(__FILE__) + '/../test_helper'

class ApplicationHelperTest < ActionView::TestCase
  def setup
    stubs(:protect_against_forgery? => false)
  end
  
  test "should convert seconds in readable strings" do
    assert_equal '1 seconds', duration(1)
    assert_equal '2 minutes, 3 seconds', duration(123)
    assert_equal '2 minutes', duration(120)
    assert_equal '4 hours, 21 minutes, 5 seconds', duration(15665)
    assert_equal '4 hours, 21 minutes', duration(15660)
    assert_equal '4 hours, 5 seconds', duration(14405)
    assert_equal '15 days, 8 hours, 45 minutes, 2 seconds', duration(1327502)
    assert_equal '15 days, 2 seconds', duration(1296002)
  end
  
  test "should auto update current page" do
    expects(:request).returns(mock(:request_uri => '/some/url'))
    result = auto_update('queue')
    assert result =~ /queue/ && result =~ /\/some\/url/
  end
end
