require File.dirname(__FILE__) + '/../test_helper'

class UserSessionsControllerTest < ActionController::TestCase
  setup :activate_authlogic
  
  test "should get login form" do
    get :new
    assert_response :success
  end
  
  test "should login user" do
    user = User.create!(:login => 'alice', :password => 'foobar', :password_confirmation => 'foobar', :email => 'alice@example.com')
    post :create, :user_session => { :login => 'alice', :password => 'foobar' }
    assert_response :redirect
    assert_not_nil flash[:notice]
  end
  
  test "should not login user with wrong credentials" do
    user = User.create!(:login => 'alice', :password => 'foobar', :password_confirmation => 'foobar', :email => 'alice@example.com')
    post :create, :user_session => { :login => 'alice', :password => 'wrong_password' }
    assert_response :success
    assert_nil flash[:notice]
  end
  
  test "should log out user" do
    user = User.create!(:login => 'alice', :password => 'foobar', :password_confirmation => 'foobar', :email => 'alice@example.com')
    UserSession.create(user)
    delete :destroy
    assert_response :redirect
    assert_not_nil flash[:notice]
  end
end
