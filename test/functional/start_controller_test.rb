require File.dirname(__FILE__) + '/../test_helper'

class StartControllerTest < ActionController::TestCase
  test "should get index on empty database" do
    get 'index'
    assert_response :success
  end
  
  test "should get index on filled database" do
    Slave.create(:name => 'some_slave', :protocol => 'localhost')
    get 'index'
    assert_response :success
  end
  
  test "should update index on filled database" do
    Slave.create(:name => 'some_slave', :protocol => 'localhost')
    xhr :get, 'index'
    assert_response :success
  end
end
