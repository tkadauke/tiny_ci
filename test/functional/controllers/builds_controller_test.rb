require_relative "../test_helper"
class BuildsControllerTest < ActionController::TestCase
  def setup
    @project = Project.create(:name => 'default')
    @user = create_user
    login_with @user
  end
  
  test "should render index page" do
    plan = @project.plans.create(:name => 'some_plan')
    
    get :index, params: { project_id: @project.name, plan_id: plan.name }
    assert_response :success
  end
  
  test "should update index page" do
    plan = @project.plans.create(:name => 'some_plan')
    
    get :index, params: { project_id: @project.name, plan_id: plan.name }, xhr: true
    assert_response :success
  end
  
  test "should raise record not found if plan not found" do
    assert_raise ActiveRecord::RecordNotFound do
      get :index, params: { project_id: @project.name, plan_id: 'nonexistent' }
    end
  end
  
  test "should show build" do
    plan = @project.plans.create(:name => 'some_plan')
    build = plan.builds.create(:status => 'success', :starter => @user)

    get :show, params: { project_id: @project.name, plan_id: plan.name, id: build.position }
    assert_response :success
  end
  
  test "should update build output" do
    plan = @project.plans.create(:name => 'some_plan')
    build = plan.builds.create(:status => 'success')
    
    get :show, params: { project_id: @project.name, plan_id: plan.name, id: build.position }, xhr: true
    assert_response :success
  end
  
  test "should raise record not found if build does not exist" do
    plan = @project.plans.create(:name => 'some_plan')

    assert_raise ActiveRecord::RecordNotFound do
      get :show, params: { project_id: @project.name, plan_id: plan.name, id: 999 }
    end
  end
  
  test "should create build" do
    plan = @project.plans.create(:name => 'some_plan')
    
    assert_difference 'Build.count' do
      post :create, params: { project_id: @project.name, plan_id: plan.name }
      assert_response :redirect
      assert_not_nil flash[:notice]
    end
  end
  
  test "should create build as logged in user" do
    plan = @project.plans.create(:name => 'some_plan')

    post :create, params: { project_id: @project.name, plan_id: plan.name }
    assert_equal @user, Build.last.starter
  end
  
  test "should stop build" do
    plan = @project.plans.create(:name => 'some_plan')
    build = plan.builds.create(:status => 'running')
  
    post :stop, params: { project_id: @project.name, plan_id: plan.name, id: build.position }
    assert_response :redirect
    assert build.reload.stopping?
  end

  test "should stop build over xhr" do
    plan = @project.plans.create(:name => 'some_plan')
    build = plan.builds.create(:status => 'running')
  
    post :stop, params: { project_id: @project.name, plan_id: plan.name, id: build.position }, xhr: true
    assert_response :success
    assert build.reload.stopping?
  end
end
