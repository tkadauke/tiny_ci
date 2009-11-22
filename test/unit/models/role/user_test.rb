require File.dirname(__FILE__) + '/../../test_helper'

class Role::UserTest < ActiveSupport::TestCase
  class TestUser
    include Role::User
  end
  
  test "should allow things" do
    user = TestUser.new
    
    assert user.can_create_projects?
    assert user.can_create_plans?
    assert user.can_edit_projects?
    assert user.can_edit_plans?
    assert user.can_edit_plan?
  end
  
  test "should allow user to edit own account" do
    user = TestUser.new
    
    assert user.can_edit_account?(user)
    assert ! user.can_edit_account?(TestUser.new)
  end
  
  test "should generally forbid things" do
    user = TestUser.new
    
    assert ! user.can_do_anything?
  end
end
