require 'test_helper'

class PlansControllerTest < ActionController::TestCase
  test "should render index page" do
    plan = Plan.create(:name => 'some_plan')
    
    get 'index'
    assert_response :success
  end
  
  test "should show plan" do
    plan = Plan.create(:name => 'some_plan')
    
    get 'show', :id => plan.name
    assert_response :success
  end
  
  test "should raise record not found if plan not found" do
    plan = Plan.create(:name => 'some_plan')
    
    get 'show', :id => plan.name
    assert_response :success
  end
  
  test "should show new form" do
    get 'new'
    assert_response :success
  end
  
  test "should show edit form" do
    plan = Plan.create(:name => 'some_plan')
    
    get 'edit', :id => plan.name
    assert_response :success
  end
  
  test "should create plan" do
    assert_difference 'Plan.count' do
      post 'create', :plan => { :name => 'some_plan' }
      assert_response :redirect
      assert_not_nil flash[:notice]
    end
  end
  
  test "should update plan" do
    plan = Plan.create(:name => 'some_plan')
    
    post 'update', :id => plan.name, :plan => { :name => 'some_plan_with_new_name' }
    assert_response :redirect
    assert_not_nil flash[:notice]
  end
end
