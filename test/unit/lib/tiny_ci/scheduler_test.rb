require_relative "../../../test_helper"

class TinyCI::SchedulerTest < ActiveJob::TestCase
  test "tick assigns the next buildable build to a free slave and enqueues a BuildJob" do
    pending_build = stub(buildable?: true, id: 7)
    slave = stub
    Build.expects(:pending).returns(stub(to_a: [pending_build]))
    Slave.expects(:find_free_slave_for).with(pending_build).returns(slave)
    pending_build.expects(:assign_to!).with(slave)
    TinyCI::Scheduler.expects(:start).with(pending_build)

    TinyCI::Scheduler.tick
  end

  test "tick does nothing if no build is pending" do
    Build.expects(:pending).returns(stub(to_a: []))
    Slave.expects(:find_free_slave_for).never

    TinyCI::Scheduler.tick
  end

  test "tick does nothing if no slave is free" do
    pending_build = stub(buildable?: true)
    Build.expects(:pending).returns(stub(to_a: [pending_build]))
    Slave.expects(:find_free_slave_for).with(pending_build).returns(nil)
    pending_build.expects(:assign_to!).never

    TinyCI::Scheduler.tick
  end

  test "tick swallows exceptions from the scheduling pass" do
    Build.expects(:pending).raises("oh noes")

    assert_nothing_raised do
      TinyCI::Scheduler.tick
    end
  end

  test "start marks the build running and enqueues a BuildJob" do
    build = stub(id: 42)
    build.expects(:update).with(has_entries(status: "running"))

    assert_enqueued_with(job: BuildJob, args: [42]) do
      TinyCI::Scheduler.start(build)
    end
  end
end
