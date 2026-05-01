require_relative "../test_helper"

class MetricsControllerTest < ActionController::TestCase
  setup do
    @project = Project.create!(name: "metrics_project")
    @plan = @project.plans.create!(name: "metrics_plan")
  end

  test "GET /metrics returns Prometheus text format with the right content-type" do
    get :index

    assert_response :success
    assert_match(/^text\/plain/, response.content_type)
    # Each metric should have its HELP, TYPE, and a numeric value.
    %w[
      tiny_ci_pending_builds
      tiny_ci_running_builds
      tiny_ci_slaves_total
      tiny_ci_slaves_online
    ].each do |metric|
      assert_match(/^# HELP #{metric} /, response.body)
      assert_match(/^# TYPE #{metric} gauge/, response.body)
      assert_match(/^#{metric} \d+(\.\d+)?$/, response.body)
    end
  end

  test "metric values reflect current DB state" do
    Slave.create!(name: "alpha", protocol: "localhost")
    Slave.create!(name: "beta",  protocol: "localhost", offline: true)
    @plan.builds.create!(status: "pending")
    @plan.builds.create!(status: "pending")
    @plan.builds.create!(status: "running")

    get :index

    assert_response :success
    assert_match(/^tiny_ci_pending_builds 2(\.0)?$/, response.body)
    assert_match(/^tiny_ci_running_builds 1(\.0)?$/, response.body)
    assert_match(/^tiny_ci_slaves_total 2(\.0)?$/, response.body)
    assert_match(/^tiny_ci_slaves_online 1(\.0)?$/, response.body)
  end
end
