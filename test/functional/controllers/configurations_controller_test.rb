require File.dirname(__FILE__) + '/../test_helper'

class ConfigurationsControllerTest < ActionController::TestCase
  test "should show user settings" do
    login_with create_user
    
    get 'show'
    assert_response :success
  end
  
  test "should update user settings" do
    user = create_user
    login_with user
    
    post 'create', :config => { :growl_host => 'localhost' }
    assert_not_nil flash[:notice]
    assert_response :redirect
    
    assert_equal 'localhost', user.reload.config.growl_host
  end
end
