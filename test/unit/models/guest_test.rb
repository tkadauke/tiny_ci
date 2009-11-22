require File.dirname(__FILE__) + '/../test_helper'

class GuestTest < ActiveSupport::TestCase
  test "should promote to initial admin if no users are present" do
    User.stubs(:count).returns(0)
    guest = Guest.new
    assert guest.initial_admin?
  end
  
  test "should not promote to initial admin if there are users" do
    User.stubs(:count).returns(14)
    guest = Guest.new
    assert ! guest.initial_admin?
  end
  
  test "should convert to user" do
    assert_nil Guest.new.to_user
  end
end
