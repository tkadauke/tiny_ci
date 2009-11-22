require File.dirname(__FILE__) + '/../test_helper'

class UsersControllerTest < ActionController::TestCase
  def setup
    @user = create_user(:login => 'alice')
  end
  
  test "should show user list" do
    get :index
    assert_response :success
  end
  
  test "should show profile" do
    get :show, :id => @user.login
    assert_response :success
  end
  
  test "should show own edit page" do
    login_with @user
    get :edit, :id => @user.login
    assert_response :success
  end
  
  test "should show other users edit page for admin" do
    admin = create_admin
    login_with admin
    get :edit, :id => @user.login
    assert_response :success
  end
  
  test "should update own profile" do
    login_with @user
    
    post :update, :id => @user.login, :user => { :email => 'alice2@example.com' }
    assert_response :redirect
    assert_equal 'alice2@example.com', User.find_by_login!('alice').email
  end
  
  test "should update profile for admin" do
    admin = create_admin
    login_with admin

    post :update, :id => @user.login, :user => { :email => 'alice2@example.com' }
    assert_response :redirect
    assert_equal 'alice2@example.com', User.find_by_login!('alice').email
  end
  
  test "should not update profile for unauthorized user" do
    post :update, :id => @user.login, :user => { :email => 'alice2@example.com' }
    assert_access_denied
  end
  
  test "should show new" do
    get :new
    assert_response :success
  end
  
  test "should create user" do
    assert_difference 'User.count' do
      post :create, :user => { :login => 'bob', :password => 'foobar', :password_confirmation => 'foobar', :email => 'bob@example.com' }
      assert_response :redirect
      assert_not_nil flash[:notice]
    end
  end
  
  test "should not create invalid user" do
    assert_no_difference 'User.count' do
      post :create, :user => { :login => 'bob' }
      assert_response :success
      assert_nil flash[:notice]
    end
  end
end
