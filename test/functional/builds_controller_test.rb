require 'test_helper'

class BuildsControllerTest < ActionController::TestCase
  test "should render index page" do
    plan = Plan.create(:name => 'some_plan')
    
    get 'index', :plan_id => plan.name
    assert_response :success
  end
  
  test "should raise record not found if plan not found" do
    assert_raise ActiveRecord::RecordNotFound do
      get 'index', :plan_id => nil
    end
  end
  
  test "should show build" do
    plan = Plan.create(:name => 'some_plan')
    build = plan.builds.create(:status => 'success')
    
    get 'show', :plan_id => plan.name, :id => build.position
    assert_response :success
  end
  
  test "should raise record not found if build does not exist" do
    plan = Plan.create(:name => 'some_plan')
    
    assert_raise ActiveRecord::RecordNotFound do
      get 'show', :plan_id => plan.name, :id => nil
    end
  end
  
  test "should create build" do
    plan = Plan.create(:name => 'some_plan')
    
    post 'create', :plan_id => plan.name
    assert_response :redirect
    assert_not_nil flash[:notice]
  end
end
