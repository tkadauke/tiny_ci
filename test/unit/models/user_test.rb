require File.dirname(__FILE__) + '/../test_helper'

class UserTest < ActiveSupport::TestCase
  test "should use login as param" do
    assert_equal 'alice', User.new(:login => 'alice').to_param
  end
  
  test "should find users by login" do
    User.expects(:find_by_login!).with('alice')
    User.from_param!('alice')
  end
  
  test "should return false when asked if initial admin" do
    assert ! User.new.initial_admin?
  end
  
  test "should convert to user" do
    user = User.new
    assert_equal user, user.to_user
  end
  
  test "should return config object" do
    user = User.new
    User::Configuration.expects(:new).with(user)
    user.config
  end
end
