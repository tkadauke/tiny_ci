require File.dirname(__FILE__) + '/../test_helper'

class ApplicationControllerTest < ActionController::TestCase
  class TestController < ApplicationController
    before_filter :require_user, :only => :user_action
    
    def user_action
      render :text => 'OK'
    end
  end
  
  def setup
    @controller = TestController.new
  end
  
  test "should run action if user required and logged in" do
    login_with create_user
    
    get 'user_action'
    assert_response :success
  end
  
  test "should redirct if user required but not logged in" do
    get 'user_action'
    assert_response :redirect
  end
end
