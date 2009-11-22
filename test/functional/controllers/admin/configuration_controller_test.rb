require File.dirname(__FILE__) + '/../../test_helper'

class Admin::ConfigurationControllerTest < ActionController::TestCase
  test "should show index" do
    get 'index'
    assert_response :success
  end
  
  test "should update" do
    post 'update', :config => { 'base_path' => '/some/path' }
    assert_not_nil flash[:notice]
    assert_equal '/some/path', TinyCI::Config.base_path
  end
  
  test "should not update configuration for unauthorized user" do
    create_user
    
    post 'update', :config => { 'base_path' => '/some/path' }
    assert_access_denied
  end
end
