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
  
  test "should update index page" do
    plan = @project.plans.create(:name => 'some_plan')
    
    xhr :get, 'index', :project_id => @project.name, :plan_id => plan.name
    assert_response :success
  end
  
  test "should raise record not found if plan not found" do
    assert_raise ActiveRecord::RecordNotFound do
      get 'index', :project_id => @project.name, :plan_id => nil
    end
  end
  
  test "should show build" do
    user = create_user
    plan = @project.plans.create(:name => 'some_plan')
    build = plan.builds.create(:status => 'success', :starter => user)
    
    get 'show', :project_id => @project.name, :plan_id => plan.name, :id => build.position
    assert_response :success
  end
  
  test "should update build output" do
    plan = @project.plans.create(:name => 'some_plan')
    build = plan.builds.create(:status => 'success')
    
    xhr :get, 'show', :project_id => @project.name, :plan_id => plan.name, :id => build.position
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
    
    assert_difference 'Build.count' do
      post 'create', :project_id => @project.name, :plan_id => plan.name
      assert_response :redirect
      assert_not_nil flash[:notice]
    end
  end
  
  test "should create build as logged in user" do
    user = create_user
    
    plan = @project.plans.create(:name => 'some_plan')
    
    login_with user
    post 'create', :project_id => @project.name, :plan_id => plan.name
    assert_equal user, Build.last.starter
  end
  
  test "should stop build" do
    plan = @project.plans.create(:name => 'some_plan')
    build = plan.builds.create(:status => 'running')
  
    post 'stop', :project_id => @project.name, :plan_id => plan.name, :id => build.position
    assert_response :redirect
    assert build.reload.stopping?
  end

  test "should stop build over xhr" do
    plan = @project.plans.create(:name => 'some_plan')
    build = plan.builds.create(:status => 'running')
  
    xhr :post, 'stop', :project_id => @project.name, :plan_id => plan.name, :id => build.position
    assert_response :success
    assert build.reload.stopping?
  end
end
