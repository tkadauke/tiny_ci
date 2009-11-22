require File.dirname(__FILE__) + '/../../test_helper'

class Role::BaseTest < ActiveSupport::TestCase
  class TestSomething
    include Role::Base
  end
  
  test "should allow nothing" do
    admin = TestSomething.new
    assert ! admin.can_do_anything?
  end
end
