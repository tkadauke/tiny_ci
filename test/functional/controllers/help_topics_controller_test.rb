require File.dirname(__FILE__) + '/../test_helper'

class HelpTopicsControllerTest < ActionController::TestCase
  test "should show index page by default" do
    get 'index'
    assert_response :success
    assert_select 'h2', 'Welcome to TinyCI Help'
  end

  test "should show help topic" do
    get 'show', :id => 'test'
    assert_response :success
    assert_select 'h2', 'Test Page'
  end
  
  test "should render 404 page when help topic does not exist" do
    assert_nothing_raised do
      get 'show', :id => 'asdf'
      assert_response :not_found
      assert_template '404'
    end
  end
end
