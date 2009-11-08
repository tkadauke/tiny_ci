require File.dirname(__FILE__) + '/../../../test_helper'

class Admin::SetupControllerTest < ActionController::TestCase
  def setup
    ENV['SETUP'] = 'true'
  end
  
  def teardown
    ENV['SETUP'] = 'false'
  end
  
  test "should get index page" do
    get 'index'
    assert_response :success
  end
end
