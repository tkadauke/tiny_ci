require_relative "../../test_helper"

class Api::DashboardControllerTest < ActionController::TestCase
  def setup
    @user = create_user
    login_with @user
  end

  test "requires login" do
    logout

    get :show

    assert_redirected_to_login
  end

  test "returns dashboard data" do
    project = Project.create!(name: "default")
    plan = project.plans.create!(name: "some_plan")
    pending = plan.builds.create!(status: "pending", starter: @user)
    finished = plan.builds.create!(status: "success", started_at: 5.seconds.ago, finished_at: Time.current)
    slave = Slave.create!(name: "worker-1", protocol: "localhost")
    running = plan.builds.create!(status: "running", slave: slave)

    get :show

    assert_response :success
    body = JSON.parse(response.body)

    assert_equal [pending.id], body["queue"].map { |build| build["id"] }
    assert_equal ["worker-1"], body["slaves"].map { |item| item["name"] }
    assert_equal [running.id], body["slaves"].first["running_builds"].map { |build| build["id"] }
    assert_equal [finished.id], body["recent_builds"].map { |build| build["id"] }

    build = body["queue"].first
    assert_equal pending.position, build["position"]
    assert_equal @user.login, build["starter_login"]
    assert_equal "some_plan", build["plan"]["name"]
    assert_equal "default", build["plan"]["project_name"]
    assert_equal "default", build["plan"]["project_id"]
    assert_equal "some_plan", build["plan"]["plan_id"]
    assert_equal false, build["has_children"]
    assert_equal [], build["children"]
  end
end
