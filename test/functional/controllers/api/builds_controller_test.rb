require "csv"
require_relative "../../test_helper"

module Api
  class BuildsControllerTest < ActionController::TestCase
    def setup
      @project = Project.create!(name: "default")
      @plan = @project.plans.create!(name: "some_plan")
      @user = create_user
      login_with @user
    end

    test "requires login" do
      logout

      get :index, params: { project_id: @project.name, plan_id: @plan.name }

      assert_response :unauthorized
      assert_equal ["Login required"], response.parsed_body["errors"]
    end

    test "returns plan builds newest first with children" do
      older = @plan.builds.create!(status: "success", created_at: 2.days.ago)
      newer = @plan.builds.create!(status: "failure", created_at: 1.day.ago, starter: @user)
      child_plan = @project.plans.create!(name: "child_plan")
      child = child_plan.builds.create!(status: "pending", parent: newer)

      get :index, params: { project_id: @project.name, plan_id: @plan.name }

      assert_response :success
      body = response.parsed_body

      assert_equal [newer.id, older.id], body.map { |build| build["id"] }
      assert_equal "failure", body.first["status"]
      assert_equal @user.login, body.first["starter"]["login"]
      assert_equal true, body.first["has_children"]
      assert_equal [child.id], body.first["children"].map { |build| build["id"] }
      assert_equal "child_plan", body.first["children"].first["plan"]["name"]
    end

    test "returns build found by plan-local position with output rows" do
      output = CSV.generate_line([1.5, "rake", "first line"]) + CSV.generate_line([2.5, "rake", "second line"])
      slave = Slave.create!(name: "worker-1", protocol: "localhost")
      build = @plan.builds.create!(
        status: "success",
        revision: "abc123",
        slave: slave,
        starter: @user,
        output: output
      )

      get :show, params: { project_id: @project.name, plan_id: @plan.name, id: build.position }

      assert_response :success
      body = response.parsed_body

      assert_equal build.id, body["id"]
      assert_equal "some_plan", body["name"]
      assert_equal build.position, body["position"]
      assert_equal "Success", body["status_text"]
      assert_equal "abc123", body["revision"]
      assert_equal "worker-1", body["slave"]["name"]
      assert_equal @user.id, body["starter_id"]
      assert_equal @user.login, body["starter_login"]
      assert_equal @user.login, body["starter"]["login"]
      assert_equal output, body["output"]
      assert_equal 2, body["output_rows"].size
      assert_equal 0, body["output_rows"].first["index"]
      assert_equal "rake", body["output_rows"].first["command"]
      assert_equal "first line", body["output_rows"].first["line"]
    end

    test "does not find build by database id" do
      other_plan = @project.plans.create!(name: "other_plan")
      other_plan.builds.create!(status: "success")
      other_plan.builds.create!(status: "success")
      build = @plan.builds.create!(status: "success")

      get :show, params: { project_id: @project.name, plan_id: @plan.name, id: build.id }

      assert_response :not_found
      assert_equal ["Not found"], response.parsed_body["errors"]
    end

    test "stops build and returns ok" do
      build = @plan.builds.create!(status: "running")

      post :stop, params: { project_id: @project.name, plan_id: @plan.name, id: build.position }

      assert_response :success
      assert_equal true, response.parsed_body["ok"]
      assert build.reload.stopping?
    end
  end
end
