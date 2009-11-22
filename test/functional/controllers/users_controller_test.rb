require File.dirname(__FILE__) + '/../test_helper'

class UsersControllerTest < ActionController::TestCase
  def setup
    @user = User.create!(:login => 'alice', :password => 'foobar', :password_confirmation => 'foobar', :email => 'alice@example.com')
  end
  
  test "should show user list" do
    get :index
    assert_response :success
  end
  
  test "should show profile" do
    get :show, :id => @user.login
    assert_response :success
  end
  
  test "should show edit page" do
    get :edit, :id => @user.login
    assert_response :success
  end
  
  test "should update profile" do
    post :update, :id => @user.login, :user => { :email => 'alice2@example.com' }
    assert_response :redirect
    assert_equal 'alice2@example.com', User.find_by_login!('alice').email
  end
end
