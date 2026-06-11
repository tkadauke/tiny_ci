require_relative "../../../../test_helper"

class TinyCI::Shell::LocalhostTest < ActiveSupport::TestCase
  test "should return false for exists? if working dir does not exist" do
    working_dir = "/some/dir"
    File.stubs(:exist?).returns(false)
    File.expects(:exist?).with(working_dir).returns(false)

    localhost = TinyCI::Shell::Localhost.new(stub)
    assert_not localhost.exists?("some/file", working_dir)
  end

  test "should look for file in working dir" do
    working_dir = "/some/dir"
    file_name = "some/file"
    # Other gems (e.g. the debug gem's source repository) call File.exist?
    # for unrelated paths during the test, so stub the catch-all and only
    # constrain the calls we actually care about.
    File.stubs(:exist?).returns(false)
    File.stubs(:exist?).with(working_dir).returns(true)
    File.stubs(:exist?).with(file_name).returns(true)
    Dir.expects(:chdir).yields.returns(true)

    localhost = TinyCI::Shell::Localhost.new(stub)
    assert localhost.exists?(file_name, working_dir)
  end

  test "should create directory" do
    FileUtils.expects(:mkdir_p).with("/some/path")
    localhost = TinyCI::Shell::Localhost.new(stub)
    localhost.mkdir("/some/path")
  end

  test "should capture output" do
    localhost = TinyCI::Shell::Localhost.new(stub)
    Dir.expects(:chdir).with("/some/dir").yields.returns("command output")
    IO.expects(:popen).with(["sh", "-c", "ls"]).returns("command output")
    assert_equal "command output", localhost.capture("ls", "/some/dir")
  end

  test "should run command" do
    build = stub(add_to_output: nil, flush_output!: nil, current_environment: {})
    stdout = stub(gets: "output")
    stdout.stubs(:eof?).returns(false).then.returns(true)

    IO.expects(:popen).yields(stdout)

    localhost = TinyCI::Shell::Localhost.new(build)
    localhost.expects(:success?).returns(true)
    localhost.run("some_command", ["parameters"], ".", {})
  end

  test "should set environment variables when running commands" do
    build = stub(current_environment: { "BUILD_KEY" => "BUILD_VALUE" })

    IO.expects(:popen).with do |env, argv|
      env["BUILD_KEY"] == "BUILD_VALUE" &&
        env["COMMAND_KEY"] == "COMMAND_VALUE" &&
        argv[0] == "sh" && argv[1] == "-c" && argv[2] =~ /some_command/
    end

    localhost = TinyCI::Shell::Localhost.new(build)
    localhost.expects(:success?).returns(true)
    localhost.run("some_command", ["parameters"], ".", { "COMMAND_KEY" => "COMMAND_VALUE" })
  end

  test "should pass nil-valued env vars through to popen so they unset" do
    build = stub(current_environment: { "KEEP_ME" => "yes" })

    IO.expects(:popen).with do |env, argv|
      env["KEEP_ME"] == "yes" &&
        env.key?("BUNDLE_GEMFILE") && env["BUNDLE_GEMFILE"].nil? &&
        argv[0] == "sh" && argv[1] == "-c"
    end

    localhost = TinyCI::Shell::Localhost.new(build)
    localhost.expects(:success?).returns(true)
    localhost.run("some_command", [], ".", { "BUNDLE_GEMFILE" => nil })
  end

  test "should escape parameters so shell metas in a parameter cannot be reinterpreted" do
    build = stub(add_to_output: nil, flush_output!: nil, current_environment: {})

    IO.expects(:popen).with do |_env, argv|
      cmdline = argv.last
      # The raw injection sequence must NOT survive into the cmdline; only
      # the escaped form is allowed.
      !cmdline.include?("; rm -rf /") &&
        cmdline.include?(Shellwords.escape("; rm -rf /"))
    end

    localhost = TinyCI::Shell::Localhost.new(build)
    localhost.expects(:success?).returns(true)
    localhost.run("echo", ["; rm -rf /"], ".", {})
  end

  test "should pass env values as a hash so shell metas in env are not interpolated" do
    build = stub(add_to_output: nil, flush_output!: nil, current_environment: {})

    IO.expects(:popen).with do |env, argv|
      cmdline = argv.last
      # env value is set via the popen env hash, never inlined into the
      # shell command, so $(whoami) is just a string here.
      env["INJECT"] == "$(whoami); rm -rf /" &&
        !cmdline.include?("$(whoami)")
    end

    localhost = TinyCI::Shell::Localhost.new(build)
    localhost.expects(:success?).returns(true)
    localhost.run("echo", ["hi"], ".", { "INJECT" => "$(whoami); rm -rf /" })
  end

  test "should raise exception when command fails" do
    build = stub(current_environment: {})

    IO.expects(:popen)

    localhost = TinyCI::Shell::Localhost.new(build)
    localhost.expects(:success?).returns(false)
    assert_raise TinyCI::Shell::CommandExecutionFailed do
      localhost.run("some_command", ["parameters"], ".", {})
    end
  end

  test "should raise BuildStopped from check_for_stop! when build status is stopping" do
    build = mock
    build.expects(:reload).returns(build)
    build.stubs(:status).returns("stopping")

    localhost = TinyCI::Shell::Localhost.new(build)
    assert_raise TinyCI::BuildStopped do
      localhost.send(:check_for_stop!)
    end
  end

  test "should not raise from check_for_stop! when build is still running" do
    build = mock
    build.expects(:reload).returns(build)
    build.stubs(:status).returns("running")

    localhost = TinyCI::Shell::Localhost.new(build)
    assert_nothing_raised do
      localhost.send(:check_for_stop!)
    end
  end

  test "should treat a deleted build as a stop in check_for_stop!" do
    build = mock
    build.expects(:reload).raises(ActiveRecord::RecordNotFound)

    localhost = TinyCI::Shell::Localhost.new(build)
    assert_raise TinyCI::BuildStopped do
      localhost.send(:check_for_stop!)
    end
  end

  test "should propagate BuildStopped out of run when stop check fires" do
    build = stub(add_to_output: nil, flush_output!: nil, current_environment: {})
    stdout = stub(gets: "output")
    stdout.stubs(:eof?).returns(false).then.returns(false).then.returns(true)
    IO.expects(:popen).yields(stdout)

    # Advance Time.now past the 1-second cadence so check_for_stop! fires
    # on the first loop iteration. Sequence: initial last_stop_check, then
    # add_to_output's call, then the cadence comparison.
    t0 = Time.now
    Time.stubs(:now).returns(t0, t0, t0 + 2)

    localhost = TinyCI::Shell::Localhost.new(build)
    localhost.expects(:check_for_stop!).raises(TinyCI::BuildStopped)

    assert_raise TinyCI::BuildStopped do
      localhost.run("some_command", [], ".", {})
    end
  end
end
