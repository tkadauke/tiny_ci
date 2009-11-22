require File.dirname(__FILE__) + '/../test_helper'
require "authlogic/test_case"

class ActionController::TestCase
  setup :activate_authlogic
  
  def create_user(attributes = {})
    default_attributes = {
      :login => 'alice',
      :password => 'password',
      :password_confirmation => 'password',
      :email => (attributes[:login] || 'alice') + '@example.com'
    }
    returning User.create!(default_attributes.merge(attributes)) do
      logout
    end
  end
  
  def create_admin(attributes = {})
    default_attributes = {
      :login => 'admin'
    }
    user = create_user(default_attributes.merge(attributes))
    user.role = 'admin'
    user.save
    user
  end
  
  def login_with(user)
    UserSession.create(user)
  end
  
  def logout
    UserSession.find.destroy
  end
  
  def assert_access_denied
    assert_response :redirect
    assert_equal 'You can not do that', flash[:error]
  end
end
