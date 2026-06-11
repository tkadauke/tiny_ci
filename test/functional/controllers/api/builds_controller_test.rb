require_relative "../../test_helper"

module Api
  class BuildsControllerTest < ActionController::TestCase
    def setup
      @project = Project.create!(name: "default")
      @plan = @project.plans.create!(name: "some_plan")
      @user = create_user
      login_with @user
    end

    test "lists builds as json" do
      build = @plan.builds.create!(status: "success", starter: @user)

      get :index, params: { project_id: @project.name, plan_id: @plan.name }

      assert_response :success
      assert_equal build.position, response.parsed_body.first["position"]
      assert_equal "success", response.parsed_body.first["status"]
      assert_equal @user.login, response.parsed_body.first["starter"]["login"]
    end

    test "shows build as json" do
      build = @plan.builds.create!(status: "success", output: "ok")

      get :show, params: { project_id: @project.name, plan_id: @plan.name, id: build.position }

      assert_response :success
      assert_equal build.position, response.parsed_body["position"]
      assert_equal "ok", response.parsed_body["output"]
    end

    test "stops build" do
      build = @plan.builds.create!(status: "running")

      post :stop, params: { project_id: @project.name, plan_id: @plan.name, id: build.position }

      assert_response :success
      assert_equal true, response.parsed_body["ok"]
      assert build.reload.stopping?
    end
  end
end
