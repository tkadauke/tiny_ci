require_relative "../test_helper"

class WorkerTest < ActiveSupport::TestCase
  test "should validate" do
    assert_not Worker.new.valid?
    assert_not Worker.new(name: "some_name").valid?
    assert_not Worker.new(protocol: "ssh").valid?
    assert     Worker.new(name: "some_name", protocol: "ssh").valid?
  end

  test "should clone worker" do
    original = Worker.new(name: "some_name", protocol: "ssh", username: "johndoe", password: "drowssap")
    Worker.expects(:find_by!).with(name: "some_name").returns(original)

    clone = Worker.find_for_cloning!("some_name")
    assert_nil clone.name
    assert_equal original.protocol, clone.protocol
    assert_equal original.username, clone.username
    assert_equal original.password, clone.password

    assert clone.new_record?
  end

  test "should use the global environment as fallback for the current environment" do
    worker = Worker.new(environment_variables: { 1 => { "key" => "foo", "value" => "bar" } })
    TinyCI::Config.stubs(environment: { "foo" => "baz", "hello" => "world" })

    assert_equal({ "foo" => "bar", "hello" => "world" }, worker.current_environment)
  end

  test "should figure out if worker is busy" do
    worker = Worker.new
    worker.expects(:running_builds).returns([stub])
    assert worker.busy?
  end

  test "should figure out if worker is free" do
    worker = Worker.new
    worker.expects(:running_builds).returns([])
    assert worker.free?
  end

  test "should find least busy worker for build" do
    worker = Worker.new(capabilities: "2 gb ram, linux, windows")
    plan = Plan.new(requirements: "1 gb ram, linux")
    build = Build.new(plan: plan)
    Worker.expects(:least_busy).returns([worker])
    assert_equal worker, Worker.find_free_worker_for(build)
  end

  test "should find no worker for build if requirements are too high" do
    worker = Worker.new(capabilities: "2 gb ram, linux, windows")
    plan = Plan.new(requirements: "5 gb ram, linux")
    build = Build.new(plan: plan)
    Worker.expects(:least_busy).returns([worker])
    assert_nil Worker.find_free_worker_for(build)
  end

  test "should find no worker for build if unnumbered requirements is not met" do
    worker = Worker.new(capabilities: "2 gb ram, linux, windows")
    plan = Plan.new(requirements: "1 gb ram, macos")
    build = Build.new(plan: plan)
    Worker.expects(:least_busy).returns([worker])
    assert_nil Worker.find_free_worker_for(build)
  end

  test "should find worker if max number of builds is not exceeded" do
    worker = Worker.new(max_builds: 2)
    plan = Plan.new
    pending_build = Build.new(plan: plan)
    worker.stubs(:running_builds).returns(stub(count: 1, each: nil))

    assert worker.can_build_now?(pending_build)
  end

  test "should not find worker if every worker's max number of builds is exceeded" do
    worker = Worker.new(max_builds: 2)
    plan = Plan.new
    pending_build = Build.new(plan: plan)
    worker.stubs(:running_builds).returns(stub(count: 2))

    assert_not worker.can_build_now?(pending_build)
  end

  test "should find least busy worker for build even if another build is running" do
    worker = Worker.new(capabilities: "2 gb ram, linux, windows")
    running_plan = Plan.new(requirements: "1 gb ram, linux")
    running_build = Build.new(plan: running_plan)
    worker.stubs(:running_builds).returns([running_build])

    plan = Plan.new(requirements: "1 gb ram, linux")
    build = Build.new(plan: plan)
    Worker.expects(:least_busy).returns([worker])
    assert_equal worker, Worker.find_free_worker_for(build)
  end

  test "should not find a worker for build if there are too many resources reserved" do
    worker = Worker.new(capabilities: "3 gb ram, linux, windows")
    running_plan = Plan.new(requirements: "2 gb ram, linux")
    running_build = Build.new(plan: running_plan)
    worker.stubs(:running_builds).returns([running_build])

    plan = Plan.new(requirements: "2 gb ram, linux")
    build = Build.new(plan: plan)
    Worker.expects(:least_busy).returns([worker])
    assert_nil Worker.find_free_worker_for(build)
  end

  test "should clean up environment before save" do
    worker = Worker.new(environment_variables: {
      1 => { "key" => "foo", "value" => "bar" },
      2 => { "key" => nil, "value" => nil }
    })
    worker.send(:cleanup_environment)
    assert_equal({ 1 => { "key" => "foo", "value" => "bar" } }, worker.environment_variables)
  end

  test "should use name as param" do
    assert_equal "some_worker", Worker.new(name: "some_worker").to_param
  end

  test "should find worker by name" do
    Worker.expects(:find_by!).with(name: "some_plan")
    Worker.from_param!("some_plan")
  end
end
