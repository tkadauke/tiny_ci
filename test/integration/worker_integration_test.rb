require_relative "../test_helper"

class WorkerIntegrationTest < ActiveSupport::TestCase
  setup do
    @project = Project.create(name: "some_project")
    @plan = @project.plans.create(name: "some_plan")
  end

  test "should find running builds" do
    worker = Worker.create(name: "localhost", protocol: "localhost")
    build = @plan.builds.create(worker: worker, status: "running")

    assert worker.running_builds.include?(build)
  end

  test "should find least busy workers" do
    busy_worker = Worker.create(name: "busy", protocol: "localhost", offline: false)
    bored_worker = Worker.create(name: "bored", protocol: "localhost", offline: false)
    @plan.builds.create(worker: busy_worker, status: "running")

    assert_equal [bored_worker, busy_worker], Worker.least_busy
  end

  test "should not find offline workers in least busy" do
    busy_worker = Worker.create!(name: "busy", protocol: "localhost", offline: false)
    Worker.create!(name: "bored", protocol: "localhost", offline: true)
    @plan.builds.create(worker: busy_worker, status: "running")

    assert_equal [busy_worker], Worker.least_busy
  end

  test "should save environment_variables when passed as HashWithIndifferentAccess" do
    attrs = ActiveSupport::HashWithIndifferentAccess.new(
      "0" => { "key" => "FOO", "value" => "bar" }
    )
    worker = Worker.create!(name: "alpha", protocol: "localhost", environment_variables: attrs)
    worker.reload
    assert_equal({ "0" => { "key" => "FOO", "value" => "bar" } }, worker.environment_variables)
  end

  test "should filter blank-key environment variables before saving" do
    attrs = ActiveSupport::HashWithIndifferentAccess.new(
      "0" => { "key" => "FOO", "value" => "bar" },
      "1" => { "key" => "", "value" => "" }
    )
    worker = Worker.create!(name: "beta", protocol: "localhost", environment_variables: attrs)
    worker.reload
    assert_equal({ "0" => { "key" => "FOO", "value" => "bar" } }, worker.environment_variables)
  end
end
