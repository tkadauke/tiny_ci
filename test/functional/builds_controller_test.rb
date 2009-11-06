require File.dirname(__FILE__) + '/../test_helper'

class BuildsControllerTest < ActionController::TestCase
  def setup
    @project = Project.create(:name => 'default')
  end
  
  test "should render index page" do
    plan = @project.plans.create(:name => 'some_plan')
    
    get 'index', :project_id => @project.name, :plan_id => plan.name
    assert_response :success
  end
  
  test "should raise record not found if plan not found" do
    assert_raise ActiveRecord::RecordNotFound do
      get 'index', :project_id => @project.name, :plan_id => nil
    end
  end
  
  test "should show build" do
    plan = @project.plans.create(:name => 'some_plan')
    build = plan.builds.create(:status => 'success')
    
    get 'show', :project_id => @project.name, :plan_id => plan.name, :id => build.position
    assert_response :success
  end
  
  test "should raise record not found if build does not exist" do
    plan = @project.plans.create(:name => 'some_plan')
    
    assert_raise ActiveRecord::RecordNotFound do
      get 'show', :project_id => @project.name, :plan_id => plan.name, :id => nil
    end
  end
  
  test "should create build" do
    plan = @project.plans.create(:name => 'some_plan')
    
    post 'create', :project_id => @project.name, :plan_id => plan.name
    assert_response :redirect
    assert_not_nil flash[:notice]
  end
  
  test "should stop build" do
    plan = @project.plans.create(:name => 'some_plan')
    build = plan.builds.create(:status => 'running')
  
    post 'stop', :project_id => @project.name, :plan_id => plan.name, :id => build.position
    assert_response :redirect
  end
end
