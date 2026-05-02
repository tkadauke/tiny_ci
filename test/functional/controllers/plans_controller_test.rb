require_relative "../test_helper"
class PlansControllerTest < ActionController::TestCase
  def setup
    @project = Project.create(name: "default")
    login_with create_admin
  end

  test "should render index page" do
    @project.plans.create(name: "some_plan")
    get :index, params: { project_id: @project.name }
    assert_response :success
  end

  test "should update index page" do
    @project.plans.create(name: "some_plan")
    get :index, params: { project_id: @project.name }, xhr: true
    assert_response :success
  end

  test "should render full index page" do
    @project.plans.create(name: "some_plan")
    get :full_index
    assert_response :success
  end

  test "should update full index page" do
    @project.plans.create(name: "some_plan")
    get :full_index, xhr: true
    assert_response :success
  end

  test "should show plan" do
    plan = @project.plans.create(name: "some_plan")
    get :show, params: { project_id: @project.name, id: plan.name }
    assert_response :success
  end

  test "should raise record not found if plan not found" do
    plan = @project.plans.create(name: "some_plan")
    get :show, params: { project_id: @project.name, id: plan.name }
    assert_response :success
  end

  test "should show new form" do
    get :new, params: { project_id: @project.name }
    assert_response :success
  end

  test "should redirect guest from new form to login" do
    logout
    get :new, params: { project_id: @project.name }
    assert_redirected_to_login
  end

  test "should show new form with clone" do
    plan = @project.plans.create(name: "some_plan")
    get :new, params: { project_id: @project.name, clone: plan.name }
    assert_response :success
  end

  test "should show new form with parent" do
    plan = @project.plans.create(name: "some_plan")
    get :new, params: { project_id: @project.name, parent: plan.name }
    assert_response :success
  end

  test "should show edit form" do
    plan = @project.plans.create(name: "some_plan")
    get :edit, params: { project_id: @project.name, id: plan.name }
    assert_response :success
  end

  test "should redirect guest from edit form to login" do
    logout
    plan = @project.plans.create(name: "some_plan")
    get :edit, params: { project_id: @project.name, id: plan.name }
    assert_redirected_to_login
  end

  test "should show child form" do
    plan = @project.plans.create(name: "some_plan")
    get :child, params: { project_id: @project.name, id: plan.name }
    assert_response :success
  end

  test "should create plan" do
    assert_difference "Plan.count" do
      post :create, params: { project_id: @project.name, plan: { name: "some_plan" } }
      assert_response :redirect
      assert_not_nil flash[:notice]
    end
  end

  test "should redirect guest from create to login" do
    logout
    assert_no_difference "Plan.count" do
      post :create, params: { project_id: @project.name, plan: { name: "some_plan" } }
      assert_redirected_to_login
    end
  end

  test "should not create invalid plan" do
    assert_no_difference "Plan.count" do
      post :create, params: { project_id: @project.name, plan: { name: nil } }
      assert_response :unprocessable_content
      assert_nil flash[:notice]
    end
  end

  test "should update plan" do
    plan = @project.plans.create(name: "some_plan")
    post :update, params: { project_id: @project.name, id: plan.name, plan: { name: "some_plan_with_new_name" } }
    assert_response :redirect
    assert_not_nil flash[:notice]
  end

  test "should redirect guest from update to login" do
    logout
    plan = @project.plans.create(name: "some_plan")
    post :update, params: { project_id: @project.name, id: plan.name, plan: { name: "some_plan_with_new_name" } }
    assert_redirected_to_login
  end

  test "should not update invalid plan" do
    plan = @project.plans.create(name: "some_plan")
    @project.plans.create(name: "some_plan_two")

    post :update, params: { project_id: @project.name, id: plan.name, plan: { name: "some_plan_two" } }
    assert_response :unprocessable_content
    assert_nil flash[:notice]
  end

  test "should destroy plan" do
    plan = @project.plans.create(name: "some_plan")
    assert_difference "Plan.count", -1 do
      delete :destroy, params: { project_id: @project.name, id: plan.name }
      assert_response :redirect
    end
  end

  test "should not destroy plan for unauthorized user" do
    logout
    login_with create_user
    plan = @project.plans.create(name: "some_plan")

    assert_no_difference "Plan.count", -1 do
      delete :destroy, params: { project_id: @project.name, id: plan.name }
      assert_access_denied
    end
  end
end
