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
    ssh_session.expects(:exec!).with(all_of(regexp_matches(%r{/some/path}), regexp_matches(/KEY="VALUE"/), regexp_matches(/some_command/))).returns("some output")

    ssh = TinyCI::Shell::SSH.new(@build)
    assert_equal "some output", ssh.capture("some_command", "/some/path")
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
