require File.dirname(__FILE__) + '/../test_helper'

class PlansControllerTest < ActionController::TestCase
  def setup
    @project = Project.create(:name => 'default')
  end
  
  test "should render index page" do
    plan = @project.plans.create(:name => 'some_plan')
    
    get 'index', :project_id => @project.name
    assert_response :success
  end
  
  test "should show plan" do
    plan = @project.plans.create(:name => 'some_plan')
    
    get 'show', :project_id => @project.name, :id => plan.name
    assert_response :success
  end
  
  test "should raise record not found if plan not found" do
    plan = @project.plans.create(:name => 'some_plan')
    
    get 'show', :project_id => @project.name, :id => plan.name
    assert_response :success
  end
  
  test "should show new form" do
    get 'new', :project_id => @project.name
    assert_response :success
  end
  
  test "should show new form with clone" do
    plan = @project.plans.create(:name => 'some_plan')
    
    get 'new', :project_id => @project.name, :clone => plan.name
    assert_response :success
  end
  
  test "should show new form with parent" do
    plan = @project.plans.create(:name => 'some_plan')
    
    get 'new', :project_id => @project.name, :parent => plan.name
    assert_response :success
  end
  
  test "should show edit form" do
    plan = @project.plans.create(:name => 'some_plan')
    
    get 'edit', :project_id => @project.name, :id => plan.name
    assert_response :success
  end
  
  test "should create plan" do
    assert_difference 'Plan.count' do
      post 'create', :project_id => @project.name, :plan => { :name => 'some_plan' }
      assert_response :redirect
      assert_not_nil flash[:notice]
    end
  end
  
  test "should not create invalid plan" do
    assert_no_difference 'Plan.count' do
      post 'create', :project_id => @project.name, :plan => { :name => nil }
      assert_response :success
      assert_nil flash[:notice]
    end
  end
  
  test "should update plan" do
    plan = @project.plans.create(:name => 'some_plan')
    
    post 'update', :project_id => @project.name, :id => plan.name, :plan => { :name => 'some_plan_with_new_name' }
    assert_response :redirect
    assert_not_nil flash[:notice]
  end

  test "should not update invalid plan" do
    plan = @project.plans.create(:name => 'some_plan')
    plan_two = @project.plans.create(:name => 'some_plan_two')
    
    post 'update', :project_id => @project.name, :id => plan.name, :plan => { :name => 'some_plan_two' }
    assert_response :success
    assert_nil flash[:notice]
  end
  
  test "should destroy plan" do
    plan = @project.plans.create(:name => 'some_plan')
    
    assert_difference 'Plan.count', -1 do
      delete 'destroy', :project_id => @project.name, :id => plan.name
      assert_response :redirect
    end
  end
end
