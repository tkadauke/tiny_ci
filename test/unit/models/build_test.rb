require File.dirname(__FILE__) + '/../test_helper'

class BuildTest < ActiveSupport::TestCase
  test "should use the slave's shell when building" do
    build = Build.new(:updated_at => Time.now)
    build.stubs(:plan).returns(mock(:has_children? => false))
    build.stubs(:slave => stub(:protocol => 'ssh'))
    build.stubs(:create_base_directory)
    TinyCI::DSL.stubs(:evaluate)
    build.stubs(:update_attributes)
    
    TinyCI::Shell::SSH.expects(:new).returns(stub(:mkdir))
    build.build!
  end
  
  test "should create base directory" do
    build = Build.new(:updated_at => Time.now)
    build.stubs(:plan).returns(mock(:has_children? => false))
    build.stubs(:slave => stub(:protocol => 'localhost', :base_path => '/some/base/path'))
    shell = mock(:mkdir)
    TinyCI::Shell::Localhost.stubs(:new).returns(shell)
    TinyCI::DSL.stubs(:evaluate)
    
    build.stubs(:update_attributes)
    build.build!
  end
  
  test "should evaluate steps" do
    build = Build.new(:updated_at => Time.now)
    build.stubs(:plan).returns(mock(:has_children? => false))
    build.stubs(:slave => stub(:protocol => 'localhost'))
    build.stubs(:create_base_directory)
    TinyCI::DSL.expects(:evaluate)
    
    build.stubs(:update_attributes)
    build.build!
  end
  
  test "should set status to success when finished" do
    build = Build.new(:updated_at => Time.now)
    build.stubs(:plan).returns(mock(:has_children? => false))
    build.stubs(:slave => stub(:protocol => 'localhost'))
    build.stubs(:create_base_directory)
    TinyCI::DSL.stubs(:evaluate)
    
    build.expects(:update_attributes).with(has_entry(:status => 'success'))
    build.build!
  end
  
  test "should set status to waiting when finished but children are present" do
    build = Build.new(:updated_at => Time.now)
    build.stubs(:plan).returns(mock(:has_children? => true))
    build.stubs(:slave => stub(:protocol => 'localhost'))
    build.stubs(:create_base_directory)
    TinyCI::DSL.stubs(:evaluate)
    
    build.expects(:update_attributes).with(:status => 'waiting')
    build.build!
  end
  
  test "should set status to failure on failing command" do
    build = Build.new
    build.stubs(:slave => stub(:protocol => 'localhost'))
    build.stubs(:create_base_directory)
    TinyCI::DSL.stubs(:evaluate).raises(TinyCI::Shell::CommandExecutionFailed)
    
    build.expects(:update_attributes).with(has_entry(:status => 'failure'))
    build.build!
  end
  
  test "should set status to stopped when build process is killed" do
    build = Build.new
    build.stubs(:slave => stub(:protocol => 'localhost'))
    build.stubs(:create_base_directory)
    TinyCI::DSL.stubs(:evaluate).raises(SignalException.new('TERM'))
    
    build.expects(:update_attributes).with(has_entry(:status => 'stopped'))
    build.build!
  end
  
  test "should set status to error on internal error" do
    build = Build.new(:updated_at => Time.now)
    build.stubs(:slave => stub(:protocol => 'localhost'))
    build.stubs(:create_base_directory)
    TinyCI::DSL.stubs(:evaluate).raises(RuntimeError)
    
    build.expects(:update_attributes).with(has_entry(:status => 'error'))
    build.build!
  end
  
  test "should have plan name in workspace path" do
    build = Build.new
    build.stubs(:plan).returns(mock(:name => 'some_plan'))
    build.stubs(:slave).returns(mock(:base_path => '/some/base/path'))
    assert build.workspace_path =~ /some_plan/
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
    build.stubs(:plan).returns(stub(:name => 'some_plan'))
    build.add_to_output(time, 'command', 'some output')
    build.expects(:reload).returns(build)
    build.expects(:update_attributes).with(:output => "#{time.to_f},command,some output\n")
    build.flush_output!
  end
  
  test "should use position as param" do
    build = Build.new(:position => 10)
    assert_equal '10', build.to_param
  end
  
  test "should calculate duration" do
    build = Build.new(:started_at => 2.hours.ago, :finished_at => 1.hour.ago)
    assert_equal 3600, build.duration.to_i
  end
  
  test "should use parameters as initial environment" do
    build = Build.new(:parameters => { 'foo' => 'bar' })
    assert_equal 'bar', build.environment['foo']
  end
  
  test "should use empty hash as environment if parameters are nil" do
    build = Build.new(:parameters => nil)
    assert_equal({}, build.environment)
  end
  
  test "should use the slaves environment as fallback for the current environment" do
    build = Build.new(:parameters => { 'foo' => 'bar' })
    slave = stub(:current_environment => { 'foo' => 'baz', 'hello' => 'world' })
    build.stubs(:slave).returns(slave)
    
    assert_equal({ 'foo' => 'bar', 'hello' => 'world' }, build.current_environment)
  end
  
  test "should assign build to slave" do
    slave = stub
    
    build = Build.new
    build.expects(:update_attributes).with(:slave => slave)
    build.assign_to!(slave)
  end
  
  test "should be buildable if pending and plan is buildable" do
    build = Build.new(:status => 'pending')
    build.stubs(:plan).returns(stub(:buildable? => true))
    assert build.buildable?
  end
  
  test "should not be buildable if not pending" do
    build = Build.new(:status => 'success')
    build.stubs(:plan).returns(stub(:buildable? => true))
    assert ! build.buildable?
  end
  
  test "should not be buildable if plan is not buildable" do
    build = Build.new(:status => 'pending')
    build.stubs(:plan).returns(stub(:buildable? => false))
    assert ! build.buildable?
  end
  
  test "should figure out if build is finished" do
    assert ! Build.new(:status => 'running').finished?
    assert ! Build.new(:status => 'pending').finished?
    assert ! Build.new(:status => 'waiting').finished?
    assert   Build.new(:status => 'success').finished?
    assert   Build.new(:status => 'error').finished?
    assert   Build.new(:status => 'failure').finished?
    assert   Build.new(:status => 'canceled').finished?
    assert   Build.new(:status => 'stopped').finished?
  end
  
  test "should classify finished builds in good or bad" do
    assert Build.new(:status => 'success').good?
    assert Build.new(:status => 'error').bad?
    assert Build.new(:status => 'failure').bad?
    assert Build.new(:status => 'canceled').bad?
    assert Build.new(:status => 'stopped').bad?
  end
end
