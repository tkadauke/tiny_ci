require_relative "../../../../test_helper"
require "net/ssh/test"

class TinyCI::Shell::SSHTest < ActiveSupport::TestCase
  include Net::SSH::Test

  setup do
    @build = stub(
      slave: stub(hostname: "localhost", username: "username", password: "password"),
      current_environment: {}
    )
  end

  # Net::SSH::Test#connection wraps a fake socket that's incompatible with
  # net-ssh 7.x's IO multiplexer (TypeError: no implicit conversion of
  # Net::SSH::Test::Socket into IO). Re-enable when we either pin a newer
  # net-ssh test harness or replace these with a hand-mocked Channel.
  test "should run command" do
    skip "Net::SSH::Test scripted channels broken on net-ssh 7.x"
  end

  test "should raise exception if command fails" do
    skip "Net::SSH::Test scripted channels broken on net-ssh 7.x"
  end

  test "should find out if file exists" do
    ssh_session = mock
    Net::SSH.expects(:start).returns(ssh_session)
    ssh_session.expects(:exec!).with(all_of(regexp_matches(%r{/some/path}), regexp_matches(%r{/some/file}))).returns("1")

    ssh = TinyCI::Shell::SSH.new(@build)
    assert ssh.exists?("/some/file", "/some/path")
  end

  test "should return false if file does not exist" do
    ssh_session = mock
    Net::SSH.expects(:start).returns(ssh_session)
    ssh_session.expects(:exec!).with(all_of(regexp_matches(%r{/some/path}), regexp_matches(%r{/some/file}))).returns("0")

    ssh = TinyCI::Shell::SSH.new(@build)
    assert_not ssh.exists?("/some/file", "/some/path")
  end

  test "should create directory" do
    ssh_session = mock
    Net::SSH.expects(:start).returns(ssh_session)

    ssh = TinyCI::Shell::SSH.new(@build)
    ssh.expects(:run).with("mkdir", ["-p", "/some/path"], "/", {})
    ssh.mkdir("/some/path")
  end

  test "should capture command output" do
    @build.stubs(:current_environment).returns("KEY" => "VALUE")

    ssh_session = mock
    Net::SSH.expects(:start).returns(ssh_session)
    ssh_session.expects(:exec!).with(all_of(regexp_matches(%r{/some/path}), regexp_matches(/KEY=VALUE/), regexp_matches(/some_command/))).returns("some output")

    ssh = TinyCI::Shell::SSH.new(@build)
    assert_equal "some output", ssh.capture("some_command", "/some/path")
  end

  test "should escape working_dir in exists? to block command injection" do
    ssh_session = mock
    Net::SSH.expects(:start).returns(ssh_session)
    ssh_session.expects(:exec!).with do |script|
      # The literal "; rm -rf /" must NOT survive into the script unescaped.
      !script.include?("; rm -rf /") && script.include?(Shellwords.escape("/tmp/foo; rm -rf /"))
    end.returns("0")

    ssh = TinyCI::Shell::SSH.new(@build)
    ssh.exists?("/some/file", "/tmp/foo; rm -rf /")
  end

  test "should escape path in exists? to block command injection" do
    ssh_session = mock
    Net::SSH.expects(:start).returns(ssh_session)
    ssh_session.expects(:exec!).with do |script|
      !script.include?("$(whoami)") || script.include?(Shellwords.escape("$(whoami)"))
    end.returns("0")

    ssh = TinyCI::Shell::SSH.new(@build)
    ssh.exists?("/some/$(whoami)", "/tmp")
  end

  test "should escape working_dir in capture to block command injection" do
    @build.stubs(:current_environment).returns({})
    ssh_session = mock
    Net::SSH.expects(:start).returns(ssh_session)
    ssh_session.expects(:exec!).with do |script|
      !script.include?("; rm -rf /") && script.include?(Shellwords.escape("/tmp/foo; rm -rf /"))
    end.returns("")

    ssh = TinyCI::Shell::SSH.new(@build)
    ssh.capture("ls", "/tmp/foo; rm -rf /")
  end

  test "should escape env values to block command injection" do
    @build.stubs(:current_environment).returns("INJECT" => "$(whoami); rm -rf /")
    ssh_session = mock
    Net::SSH.expects(:start).returns(ssh_session)
    ssh_session.expects(:exec!).with do |script|
      # Raw "$(whoami)" or "; rm -rf /" must not be passed to the remote shell.
      !script.include?("$(whoami); rm -rf /") &&
        script.include?(Shellwords.escape("$(whoami); rm -rf /"))
    end.returns("")

    ssh = TinyCI::Shell::SSH.new(@build)
    ssh.capture("ls", "/tmp")
  end

  test "should escape parameters and working_dir in run to block command injection" do
    @build.stubs(
      add_to_output: nil,
      flush_output!: nil,
      current_environment: {}
    )

    ssh_session = mock
    Net::SSH.expects(:start).returns(ssh_session)

    channel = mock
    channel.stubs(:wait)
    ch = mock
    captured_command = nil
    ch.expects(:exec).with do |cmd|
      captured_command = cmd
      true
    end
    ssh_session.expects(:open_channel).yields(ch).returns(channel)

    ssh = TinyCI::Shell::SSH.new(@build)
    ssh.run("git", ["clone", "; rm -rf /"], "/tmp/foo; rm -rf /", {})

    refute_includes captured_command, "clone ; rm -rf /",
      "raw parameter injection leaked into remote command"
    refute_includes captured_command, "/tmp/foo; rm -rf /",
      "raw working_dir injection leaked into remote command"
  end

  test "should raise BuildStopped from check_for_stop! when build status is stopping" do
    Net::SSH.expects(:start).returns(mock)
    @build.expects(:reload).returns(@build)
    @build.stubs(:status).returns("stopping")

    ssh = TinyCI::Shell::SSH.new(@build)
    assert_raise TinyCI::BuildStopped do
      ssh.send(:check_for_stop!)
    end
  end

  test "should treat a deleted build as a stop in check_for_stop!" do
    Net::SSH.expects(:start).returns(mock)
    @build.expects(:reload).raises(ActiveRecord::RecordNotFound)

    ssh = TinyCI::Shell::SSH.new(@build)
    assert_raise TinyCI::BuildStopped do
      ssh.send(:check_for_stop!)
    end
  end
end
