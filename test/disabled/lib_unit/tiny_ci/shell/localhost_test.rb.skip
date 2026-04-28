require File.dirname(__FILE__) + '/../../../test_helper'

class TinyCI::Shell::LocalhostTest < ActiveSupport::TestCase
  test "should return false for exists? if working dir does not exist" do
    working_dir = '/some/dir'
    File.expects(:exists?).with(working_dir).returns(false)
    
    localhost = TinyCI::Shell::Localhost.new(stub)
    assert ! localhost.exists?('some/file', working_dir)
  end

  test "should look for file in working dir" do
    working_dir = '/some/dir'
    file_name = 'some/file'
    File.expects(:exists?).with(working_dir).returns(true)
    File.expects(:exists?).with(file_name).returns(true)
    Dir.expects(:chdir).yields.returns(true)
    
    localhost = TinyCI::Shell::Localhost.new(stub)
    assert localhost.exists?(file_name, working_dir)
  end
  
  test "should create directory" do
    FileUtils.expects(:mkdir_p).with('/some/path')
    localhost = TinyCI::Shell::Localhost.new(stub)
    localhost.mkdir('/some/path')
  end
  
  test "should capture output" do
    localhost = TinyCI::Shell::Localhost.new(stub)
    localhost.expects(:`)
    Dir.expects(:chdir).with('/some/dir').yields.returns('command output')
    assert_equal 'command output', localhost.capture('ls', '/some/dir')
  end
  
  test "should run command" do
    build = stub(:add_to_output => nil, :flush_output! => nil, :current_environment => {})
    stdout = stub(:gets => 'output')
    stdout.stubs(:eof?).returns(false).then.returns(true)
    
    IO.expects(:popen).yields(stdout)
    
    localhost = TinyCI::Shell::Localhost.new(build)
    localhost.expects(:success?).returns(true)
    localhost.run('some_command', ['parameters'], '.', {})
  end
  
  test "should set environment variables when running commands" do
    build = stub(:current_environment => { 'BUILD_KEY' => 'BUILD_VALUE' })
    
    IO.expects(:popen).with(all_of(regexp_matches(/BUILD_KEY/), regexp_matches(/COMMAND_VALUE/)), any_parameters)
    
    localhost = TinyCI::Shell::Localhost.new(build)
    localhost.expects(:success?).returns(true)
    localhost.run('some_command', ['parameters'], '.', { 'COMMAND_KEY' => 'COMMAND_VALUE' })
  end
  
  test "should raise exception when command fails" do
    build = stub(:current_environment => {})
    
    IO.expects(:popen)
    
    localhost = TinyCI::Shell::Localhost.new(build)
    localhost.expects(:success?).returns(false)
    assert_raise TinyCI::Shell::CommandExecutionFailed do
      localhost.run('some_command', ['parameters'], '.', {})
    end
  end
end
