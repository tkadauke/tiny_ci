require File.dirname(__FILE__) + '/../../test_helper'

class Role::AdminTest < ActiveSupport::TestCase
  class TestAdmin
    include Role::Admin
  end
  
  test "should allow anything" do
    admin = TestAdmin.new
    assert admin.can_do_anything?
  end
  
  test "should only swallow method calls starting with can" do
    admin = TestAdmin.new
    assert_raise NoMethodError do
      admin.foobar
    end
  end
end
