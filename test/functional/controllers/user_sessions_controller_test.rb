require File.dirname(__FILE__) + '/../test_helper'

class UserSessionsControllerTest < ActionController::TestCase
  test "should get login form" do
    get :new
    assert_response :success
  end
  
  test "should login user" do
    user = create_user(:login => 'alice', :password => 'foobar', :password_confirmation => 'foobar')
    post :create, :user_session => { :login => 'alice', :password => 'foobar' }
    assert_response :redirect
    assert_not_nil flash[:notice]
  end
  
  test "should not login user with wrong credentials" do
    user = create_user
    post :create, :user_session => { :login => 'alice', :password => 'wrong_password' }
    assert_response :success
    assert_nil flash[:notice]
  end
  
  test "should log out user" do
    user = create_user
    login_with user
    delete :destroy
    assert_response :redirect
    assert_not_nil flash[:notice]
  end
end
