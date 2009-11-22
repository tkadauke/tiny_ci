require File.dirname(__FILE__) + '/../../test_helper'

class Role::InitialAdminTest < ActiveSupport::TestCase
  class TestInitialAdmin
    include Role::InitialAdmin
  end
  
  test "should allow things" do
    admin = TestInitialAdmin.new
    
    assert admin.can_configure_slaves?
    assert admin.can_configure_system_variables?
    assert admin.can_create_accounts?
    assert admin.can_create_projects?
    assert admin.can_create_plans?
    assert admin.can_edit_projects?
    assert admin.can_edit_plans?
    assert admin.can_edit_plan?
    assert admin.can_destroy_projects?
    assert admin.can_destroy_plans?
    assert admin.can_destroy_plan?
  end
  
  test "should generally forbid things" do
    admin = TestInitialAdmin.new
    
    assert ! admin.can_do_anything?
  end
end
