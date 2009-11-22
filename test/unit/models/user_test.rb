require File.dirname(__FILE__) + '/../test_helper'

class UserTest < ActiveSupport::TestCase
  test "should use login as param" do
    assert_equal 'alice', User.new(:login => 'alice').to_param
  end
  
  test "should find users by login" do
    User.expects(:find_by_login!).with('alice')
    User.from_param!('alice')
  end
end
