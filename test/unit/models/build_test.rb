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
end
