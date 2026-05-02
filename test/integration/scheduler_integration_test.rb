require_relative "../test_helper"

# End-to-end tests for TinyCI::Scheduler.tick using real Build / Plan / Slave
# records. The unit-level tests in test/unit/lib/tiny_ci/scheduler_test.rb
# mock out the model collaborators; these tests exercise the real scopes
# (Build.pending, Slave.least_busy), the real assign_to! state mutation,
# and the real BuildJob enqueue path so a regression in any of those
# surfaces against the scheduler instead of being papered over by stubs.
class SchedulerIntegrationTest < ActiveJob::TestCase
  setup do
    @project = Project.create!(name: "scheduler_int_project")
    @plan = @project.plans.create!(name: "scheduler_int_plan")
  end

  # --- Happy path -----------------------------------------------------------

  test "tick assigns the next pending build to a free slave and enqueues a BuildJob" do
    slave = Slave.create!(name: "alpha", protocol: "localhost")
    build = @plan.builds.create!(status: "pending")

    assert_enqueued_with(job: BuildJob, args: [build.id]) do
      TinyCI::Scheduler.tick
    end

    build.reload
    assert_equal slave, build.slave, "build should be assigned to the free slave"
    assert_equal "running", build.status, "tick should transition pending → running"
    assert_not_nil build.started_at
  end

  test "two consecutive ticks pick up two pending builds across two free slaves" do
    slave_a = Slave.create!(name: "alpha", protocol: "localhost")
    slave_b = Slave.create!(name: "beta",  protocol: "localhost")
    build_a = @plan.builds.create!(status: "pending")
    # A second plan so the second build is buildable in parallel — Plan#buildable?
    # gates on its own running_builds, not on the slave's state.
    other_plan = @project.plans.create!(name: "scheduler_int_plan_b")
    build_b = other_plan.builds.create!(status: "pending")

    assert_enqueued_jobs 2, only: BuildJob do
      TinyCI::Scheduler.tick
      TinyCI::Scheduler.tick
    end

    [build_a, build_b].each(&:reload)
    assert_equal "running", build_a.status
    assert_equal "running", build_b.status
    assert_includes [slave_a, slave_b], build_a.slave
    assert_includes [slave_a, slave_b], build_b.slave
    refute_equal build_a.slave, build_b.slave, "each build should land on a different free slave"
  end

  # --- No-op paths ----------------------------------------------------------

  test "tick is a no-op when no build is pending" do
    Slave.create!(name: "alpha", protocol: "localhost")

    assert_no_enqueued_jobs only: BuildJob do
      TinyCI::Scheduler.tick
    end
  end

  test "tick is a no-op when no slave is online" do
    @plan.builds.create!(status: "pending")

    assert_no_enqueued_jobs only: BuildJob do
      TinyCI::Scheduler.tick
    end
  end

  test "tick is a no-op when the only slave is offline" do
    Slave.create!(name: "alpha", protocol: "localhost", offline: true)
    @plan.builds.create!(status: "pending")

    assert_no_enqueued_jobs only: BuildJob do
      TinyCI::Scheduler.tick
    end
  end

  test "tick is a no-op when the plan already has a running build (Plan#buildable?)" do
    slave = Slave.create!(name: "alpha", protocol: "localhost")
    @plan.builds.create!(status: "running", slave: slave)
    @plan.builds.create!(status: "pending")

    assert_no_enqueued_jobs only: BuildJob do
      TinyCI::Scheduler.tick
    end
  end

  # --- Resilience -----------------------------------------------------------

  test "tick swallows StandardError raised mid-pass and does not propagate" do
    Build.expects(:pending).raises("scheduler tick boom")

    assert_nothing_raised do
      TinyCI::Scheduler.tick
    end

    assert_no_enqueued_jobs only: BuildJob
  end

  test "the surrounding transaction rolls back when start fails after assignment" do
    Slave.create!(name: "alpha", protocol: "localhost")
    build = @plan.builds.create!(status: "pending")

    # Force a failure inside the transaction *after* assign_to! has run, so
    # we can confirm the assignment is rolled back rather than leaking a
    # half-scheduled build into the DB.
    TinyCI::Scheduler.stubs(:start).raises(StandardError, "boom")

    assert_no_enqueued_jobs only: BuildJob do
      TinyCI::Scheduler.tick
    end

    build.reload
    assert_nil build.slave, "assign_to! should have been rolled back"
    assert_equal "pending", build.status, "build should still be pending after rollback"
  end
end
