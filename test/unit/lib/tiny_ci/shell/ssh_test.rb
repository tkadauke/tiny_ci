require File.dirname(__FILE__) + '/../../../test_helper'
require 'net/ssh/test'

class TinyCI::Shell::SSHTest < ActiveSupport::TestCase
  include Net::SSH::Test
  
  def setup
    @build = stub(:slave => stub(:hostname => 'localhost', :username => 'username', :password => 'password'), :current_environment => {})
  end
  
  test "should run command" do
    @build.expects(:add_to_output).with(anything, 'some_command', ['result of some_command'])
    @build.expects(:flush_output!).at_least_once
    
    Net::SSH.expects(:start).returns(connection)
    
    story do |session|
      channel = session.opens_channel
      channel.sends_exec %{/bin/bash -c 'cd /some/path; KEY="VALUE" some_command  2>&1'}
      channel.gets_data "result of some_command\neven more results"
      channel.gets_close
      channel.sends_close
    end
  
    assert_scripted do
      ssh = TinyCI::Shell::SSH.new(@build)
      ssh.run('some_command', [], '/some/path', { 'KEY' => 'VALUE' })
    end
  end
  
  test "should raise exception if command fails" do
    @build.expects(:flush_output!).at_least_once
    
    Net::SSH.expects(:start).returns(connection)
    
    story do |session|
      channel = session.opens_channel
      channel.sends_exec %{/bin/bash -c 'cd /some/path; KEY="VALUE" some_command  2>&1'}
      channel.gets_exit_status 1
    end
  
    assert_scripted do
      ssh = TinyCI::Shell::SSH.new(@build)
      assert_raise TinyCI::Shell::CommandExecutionFailed do
        ssh.run('some_command', [], '/some/path', { 'KEY' => 'VALUE' })
      end
    end
  end
  
  test "should find out if file exists" do
    ssh_session = mock
    Net::SSH.expects(:start).returns(ssh_session)
    ssh_session.expects(:exec!).with(all_of(regexp_matches(/\/some\/path/), regexp_matches(/\/some\/file/))).returns('1')
    
    ssh = TinyCI::Shell::SSH.new(@build)
    assert ssh.exists?('/some/file', '/some/path')
  end
  
  test "should return false if file does not exist" do
    ssh_session = mock
    Net::SSH.expects(:start).returns(ssh_session)
    ssh_session.expects(:exec!).with(all_of(regexp_matches(/\/some\/path/), regexp_matches(/\/some\/file/))).returns('0')
    
    ssh = TinyCI::Shell::SSH.new(@build)
    assert ! ssh.exists?('/some/file', '/some/path')
  end
  
  test "should create directory" do
    ssh_session = mock
    Net::SSH.expects(:start).returns(ssh_session)
    
    ssh = TinyCI::Shell::SSH.new(@build)
    ssh.expects(:run).with('mkdir', ['-p', '/some/path'], '/', {})
    ssh.mkdir('/some/path')
  end
  
  test "should capture command output" do
    @build.stubs(:current_environment).returns('KEY' => 'VALUE')
    
    ssh_session = mock
    Net::SSH.expects(:start).returns(ssh_session)
    ssh_session.expects(:exec!).with(all_of(regexp_matches(/\/some\/path/), regexp_matches(/KEY=\"VALUE\"/), regexp_matches(/some_command/))).returns('some output')
    
    ssh = TinyCI::Shell::SSH.new(@build)
    assert_equal 'some output', ssh.capture('some_command', '/some/path')
  end
end
