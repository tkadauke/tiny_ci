require_relative "../test_helper"

class BuildTest < ActiveSupport::TestCase
  test "should validate" do
    project = Project.create!(name: "some_project")
    plan = Plan.create!(project: project, name: "some_plan")
    assert_not Build.new.valid?
    assert     Build.new(plan: plan).valid?
  end

  test "should inherit revision from parent build if repository_url is equal" do
    parent = Build.new(revision: "17")
    parent.stubs(repository_url: "/some/url")
    child = Build.new(parent: parent)
    child.stubs(repository_url: "/some/url")

    assert_equal "17", child.revision
  end

  test "should not inherit revision from parent build if repository_url is not equal" do
    parent = Build.new(revision: "17")
    parent.stubs(repository_url: "/some/url")
    child = Build.new(parent: parent)
    child.stubs(repository_url: "/some/other/url")

    assert_nil child.revision
  end

  test "should use the slave's shell when building" do
    build = Build.new(updated_at: Time.now)
    build.stubs(:plan).returns(stub(has_children?: false))
    build.stubs(slave: stub(protocol: "ssh"))
    build.stubs(:create_base_directory)
    TinyCI::DSL.stubs(:evaluate)
    build.stubs(:update)

    TinyCI::Shell::SSH.expects(:new).returns(stub(mkdir: nil))
    build.build!
  end

  test "should create base directory" do
    build = Build.new(updated_at: Time.now)
    build.stubs(:plan).returns(stub(has_children?: false))
    build.stubs(slave: stub(protocol: "localhost", base_path: "/some/base/path"))
    shell = mock
    shell.expects(:mkdir)
    TinyCI::Shell::Localhost.stubs(:new).returns(shell)
    TinyCI::DSL.stubs(:evaluate)

    build.stubs(:update)
    build.build!
  end

  test "should evaluate steps" do
    build = Build.new(updated_at: Time.now)
    build.stubs(:plan).returns(stub(has_children?: false))
    build.stubs(slave: stub(protocol: "localhost"))
    build.stubs(:create_base_directory)
    TinyCI::DSL.expects(:evaluate)

    build.stubs(:update)
    build.build!
  end

  test "should set status to success when finished" do
    build = Build.new(updated_at: Time.now)
    build.stubs(:plan).returns(stub(has_children?: false))
    build.stubs(slave: stub(protocol: "localhost"))
    build.stubs(:create_base_directory)
    TinyCI::DSL.stubs(:evaluate)

    build.expects(:update).with(has_entry(status: "success"))
    build.build!
  end

  test "should set status to waiting when finished but children are present" do
    build = Build.new(updated_at: Time.now)
    build.stubs(:plan).returns(stub(has_children?: true))
    build.stubs(slave: stub(protocol: "localhost"))
    build.stubs(:create_base_directory)
    TinyCI::DSL.stubs(:evaluate)

    build.expects(:update).with({ status: "waiting" })
    build.build!
  end

  test "should set status to failure on failing command" do
    build = Build.new(updated_at: Time.now)
    build.stubs(slave: stub(protocol: "localhost"))
    build.stubs(:create_base_directory)
    TinyCI::DSL.stubs(:evaluate).raises(TinyCI::Shell::CommandExecutionFailed)

    build.expects(:update).with(has_entry(status: "failure"))
    build.build!
  end

  test "should ignore exception when build process is killed" do
    build = Build.new(updated_at: Time.now)
    build.stubs(slave: stub(protocol: "localhost"))
    build.stubs(:create_base_directory)
    TinyCI::DSL.stubs(:evaluate).raises(SignalException.new("TERM"))

    assert_nothing_raised do
      build.build!
    end
  end

  test "should set status to error on internal error" do
    build = Build.new(updated_at: Time.now)
    build.stubs(slave: stub(protocol: "localhost"))
    build.stubs(:create_base_directory)
    TinyCI::DSL.stubs(:evaluate).raises(RuntimeError)

    build.expects(:update).with(has_entry(status: "error"))
    build.build!
  end

  test "should stop build" do
    build = Build.new
    TinyCI::Scheduler::Client.expects(:stop).with(build)
    build.stop!
  end

  test "should notify parent when finished" do
    parent = stub(child_finished: nil)
    build = Build.new
    build.stubs(parent: parent)

    parent.expects(:child_finished).with(build)
    build.finished
  end

  test "should build next when successfully finished" do
    plan = stub(build_next!: nil)
    build = Build.new(status: "success")
    build.stubs(parent: nil)
    build.stubs(plan: plan)

    plan.expects(:build_next!).with(build)
    build.finished
  end

  test "should not build next when failed" do
    build = Build.new(status: "failure")
    build.stubs(parent: nil)
    build.expects(:plan).never
    build.finished
  end

  test "should update status to success and build next when all children finished successfully" do
    plan = stub(build_next!: nil)
    build = Build.new(status: "waiting")
    build.stubs(plan: plan)
    build.stubs(:children).returns([stub(finished?: true, success?: true)])
    build.expects(:update).with(has_entry(status: "success"))
    plan.expects(:build_next!)
    build.stubs(:success?).returns(true)

    build.child_finished(stub)
  end

  test "should update status to failure when some children failed" do
    build = Build.new(status: "waiting")
    build.stubs(:children).returns([stub(finished?: true, success?: false)])
    build.expects(:update).with(has_entry(status: "failure"))

    build.child_finished(stub)
  end

  test "should do nothing when not all children finished" do
    build = Build.new(status: "waiting")
    build.stubs(:children).returns([stub(finished?: false)])
    build.expects(:update).never

    build.child_finished(stub)
  end

  test "should do nothing when child finished but parent is not waiting" do
    build = Build.new(status: "success")
    build.stubs(:children).returns([stub(finished?: true)])
    build.expects(:update).never

    build.child_finished(stub)
  end

  test "should have plan name in workspace path" do
    build = Build.new
    build.stubs(:plan).returns(stub(name: "some_plan", project: stub(name: "some_project")))
    build.stubs(:slave).returns(stub(base_path: "/some/base/path"))
    assert_match(/some_plan/, build.workspace_path)
  end

  test "should not flush output when past line is younger than one second" do
    build = Build.new(updated_at: Time.now)
    build.expects(:flush_output!).never
    build.add_to_output(Time.now, "command", "some output")
  end

  test "should flush output after one second" do
    build = Build.new(updated_at: 2.seconds.ago)
    build.expects(:flush_output!)
    build.add_to_output(Time.now, "command", "some output")
  end

  test "should flush output" do
    time = Time.now

    build = Build.new(updated_at: time)
    build.stubs(plan: stub(name: "some_plan"))
    build.add_to_output(time, "command", "some output")
    build.expects(:update_columns).with(has_entries(output: "#{time.to_f},command,some output\n"))
    build.flush_output!
  end

  test "should use position as param" do
    build = Build.new(position: 10)
    assert_equal "10", build.to_param
  end

  test "should find build by position" do
    Build.expects(:find_by!).with(position: "10")
    Build.from_param!("10")
  end

  test "should calculate duration" do
    build = Build.new(started_at: 2.hours.ago, finished_at: 1.hour.ago)
    assert_equal 3600, build.duration.to_i
  end

  test "should use parameters as initial environment" do
    build = Build.new(parameters: { "foo" => "bar" })
    assert_equal "bar", build.environment["foo"]
  end

  test "should use empty hash as environment if parameters are nil" do
    build = Build.new(parameters: nil)
    assert_equal({}, build.environment)
  end

  test "should use the slaves environment as fallback for the current environment" do
    build = Build.new(parameters: { "foo" => "bar" })
    slave = stub(current_environment: { "foo" => "baz", "hello" => "world" })
    build.stubs(:slave).returns(slave)

    assert_equal({ "foo" => "bar", "hello" => "world" }, build.current_environment)
  end

  test "should assign build to slave" do
    slave = Slave.new(name: "some_slave", protocol: "localhost")

    build = Build.new
    build.expects(:update).with({ slave: slave })
    build.assign_to!(slave)
  end

  test "should be buildable if pending and plan is buildable" do
    build = Build.new(status: "pending")
    build.stubs(:plan).returns(stub(buildable?: true))
    assert build.buildable?
  end

  test "should not be buildable if not pending" do
    build = Build.new(status: "success")
    build.stubs(:plan).returns(stub(buildable?: true))
    assert_not build.buildable?
  end

  test "should not be buildable if plan is not buildable" do
    build = Build.new(status: "pending")
    build.stubs(:plan).returns(stub(buildable?: false))
    assert_not build.buildable?
  end

  test "should figure out if build is finished" do
    assert_not Build.new(status: "running").finished?
    assert_not Build.new(status: "pending").finished?
    assert_not Build.new(status: "waiting").finished?
    assert     Build.new(status: "success").finished?
    assert     Build.new(status: "error").finished?
    assert     Build.new(status: "failure").finished?
    assert     Build.new(status: "canceled").finished?
    assert     Build.new(status: "stopped").finished?
  end

  test "should classify finished builds in good or bad" do
    assert Build.new(status: "success").good?
    assert Build.new(status: "error").bad?
    assert Build.new(status: "failure").bad?
    assert Build.new(status: "canceled").bad?
    assert Build.new(status: "stopped").bad?
  end

  test "should figure out if build has children" do
    assert_not Build.new.has_children?

    build = Build.new
    build.expects(:children).returns([stub])
    assert build.has_children?
  end

  test "should update build stats if status changed after last save" do
    plan = mock
    plan.expects(:update_build_stats!)
    build = Build.new(status: "success")
    build.previous_changes_for_observer = { "status" => "success" }
    build.stubs(:plan).returns(plan)

    build.update_stats_if_neccessary
  end

  test "should not update build stats if status has not changed" do
    build = Build.new(status: "success")
    build.previous_changes_for_observer = {}
    build.expects(:plan).never

    build.update_stats_if_neccessary
  end
end
