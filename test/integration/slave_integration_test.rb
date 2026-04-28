require_relative "../test_helper"

class SlaveIntegrationTest < ActiveSupport::TestCase
  setup do
    @project = Project.create(name: "some_project")
    @plan = @project.plans.create(name: "some_plan")
  end

  test "should find running builds" do
    slave = Slave.create(name: "localhost", protocol: "localhost")
    build = @plan.builds.create(slave: slave, status: "running")

    assert slave.running_builds.include?(build)
  end

  test "should find least busy slaves" do
    busy_slave = Slave.create(name: "busy", protocol: "localhost", offline: false)
    bored_slave = Slave.create(name: "bored", protocol: "localhost", offline: false)
    @plan.builds.create(slave: busy_slave, status: "running")

    assert_equal [bored_slave, busy_slave], Slave.least_busy
  end

  test "should not find offline slaves in least busy" do
    busy_slave = Slave.create!(name: "busy", protocol: "localhost", offline: false)
    Slave.create!(name: "bored", protocol: "localhost", offline: true)
    @plan.builds.create(slave: busy_slave, status: "running")

    assert_equal [busy_slave], Slave.least_busy
  end
end
