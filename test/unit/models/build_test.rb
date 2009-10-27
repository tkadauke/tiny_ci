require File.dirname(__FILE__) + '/../test_helper'

class BuildTest < ActiveSupport::TestCase
  test "should start build" do
    build = Build.new
    build.expects(:update_attributes).with(:status => 'running')
    build.expects(:system).with(regexp_matches(/script\/runner/))
    build.build!
  end
  
  test "should use localhost as shell when building" do
    build = Build.new
    build.stubs(:create_project_directory)
    SimpleCI::DSL.stubs(:evaluate)
    build.stubs(:update_attributes)
    
    SimpleCI::Shell::Localhost.expects(:new).returns(stub(:mkdir))
    build.build_without_background!
  end
  
  test "should create build directory" do
    build = Build.new
    build.expects(:name => 'some_project')
    shell = mock(:mkdir)
    SimpleCI::Shell::Localhost.stubs(:new).returns(shell)
    SimpleCI::DSL.stubs(:evaluate)
    
    build.stubs(:update_attributes)
    build.build_without_background!
  end
  
  test "should evaluate steps" do
    build = Build.new
    build.stubs(:create_project_directory)
    SimpleCI::DSL.expects(:evaluate)
    
    build.stubs(:update_attributes)
    build.build_without_background!
  end
  
  test "should set status to success when finished" do
    build = Build.new
    build.stubs(:create_project_directory)
    SimpleCI::DSL.stubs(:evaluate)
    
    build.expects(:update_attributes).with(:status => 'success')
    build.build_without_background!
  end
  
  test "should set status to failure on error" do
    build = Build.new
    build.stubs(:create_project_directory)
    SimpleCI::DSL.stubs(:evaluate).raises(SimpleCI::Shell::CommandExecutionFailed)
    
    build.expects(:update_attributes).with(:status => 'failure')
    build.build_without_background!
  end
  
  test "should use project name as workspace path" do
    build = Build.new
    build.stubs(:project).returns(mock(:name => 'some_project'))
    assert_equal "#{ENV['HOME']}/simple_ci/some_project", build.workspace_path
  end
  
  test "should not flush output when past line is younger than one second" do
    build = Build.new(:updated_at => Time.now)
    build.expects(:flush_output!).never
    build.add_to_output(Time.now, 'command', 'some output')
  end
  
  test "should flush output after one second" do
    build = Build.new(:updated_at => 2.seconds.ago)
    build.expects(:flush_output!)
    build.add_to_output(Time.now, 'command', 'some output')
  end
  
  test "should flush output" do
    time = Time.now
    
    build = Build.new(:updated_at => time)
    build.stubs(:project).returns(stub(:name => 'some_project'))
    build.add_to_output(time, 'command', 'some output')
    build.expects(:reload).returns(build)
    build.expects(:update_attributes).with(:output => "#{time.to_f},command,some output\n")
    build.flush_output!
  end
  
  test "should use position as param" do
    build = Build.new(:position => 10)
    assert_equal '10', build.to_param
  end
end
