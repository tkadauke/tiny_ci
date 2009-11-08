require File.dirname(__FILE__) + '/../test_helper'

class SlaveTest < ActiveSupport::TestCase
  test "should validate" do
    assert ! Slave.new.valid?
    assert ! Slave.new(:name => 'some_name').valid?
    assert ! Slave.new(:protocol => 'ssh').valid?
    assert   Slave.new(:name => 'some_name', :protocol => 'ssh').valid?
  end
  
  test "should clone slave" do
    original = Slave.new(:name => 'some_name', :protocol => 'ssh', :username => 'johndoe', :password => 'drowssap')
    Slave.expects(:find_by_name!).with('some_name').returns(original)
    
    clone = Slave.find_for_cloning!('some_name')
    assert_nil clone.name
    assert_equal original.protocol, clone.protocol
    assert_equal original.username, clone.username
    assert_equal original.password, clone.password
    
    assert clone.new_record?
  end

  test "should use the global environment as fallback for the current environment" do
    slave = Slave.new(:environment_variables => { 1 => { 'key' => 'foo', 'value' => 'bar' }})
    TinyCI::Config.stubs(:environment => { 'foo' => 'baz', 'hello' => 'world' })
    
    assert_equal({ 'foo' => 'bar', 'hello' => 'world' }, slave.current_environment)
  end
  
  test "should figure out if slave is busy" do
    slave = Slave.new
    slave.expects(:running_builds).returns([stub])
    assert slave.busy?
  end
  
  test "should figure out if slave is free" do
    slave = Slave.new
    slave.expects(:running_builds).returns([])
    assert slave.free?
  end
  
  test "should find least busy slave for build" do
    slave = Slave.new(:capabilities => '2 gb ram, linux, windows')
    plan = Plan.new(:requirements => '1 gb ram, linux')
    build = Build.new(:plan => plan)
    Slave.expects(:least_busy).returns(mock(:find => [slave]))
    assert_equal slave, Slave.find_free_slave_for(build)
  end

  test "should find no slave for build if requirements are too high" do
    slave = Slave.new(:capabilities => '2 gb ram, linux, windows')
    plan = Plan.new(:requirements => '5 gb ram, linux')
    build = Build.new(:plan => plan)
    Slave.expects(:least_busy).returns(mock(:find => [slave]))
    assert_nil Slave.find_free_slave_for(build)
  end

  test "should find no slave for build if unnumbered requirements is not met" do
    slave = Slave.new(:capabilities => '2 gb ram, linux, windows')
    plan = Plan.new(:requirements => '1 gb ram, macos')
    build = Build.new(:plan => plan)
    Slave.expects(:least_busy).returns(mock(:find => [slave]))
    assert_nil Slave.find_free_slave_for(build)
  end

  test "should find least busy slave for build even if another build is running" do
    slave = Slave.new(:capabilities => '2 gb ram, linux, windows')
    running_plan = Plan.new(:requirements => '1 gb ram, linux')
    running_build = Build.new(:plan => running_plan)
    slave.stubs(:running_builds).returns([running_build])
    
    plan = Plan.new(:requirements => '1 gb ram, linux')
    build = Build.new(:plan => plan)
    Slave.expects(:least_busy).returns(mock(:find => [slave]))
    assert_equal slave, Slave.find_free_slave_for(build)
  end

  test "should not find a slave for build if there are too many resources reserved" do
    slave = Slave.new(:capabilities => '3 gb ram, linux, windows')
    running_plan = Plan.new(:requirements => '2 gb ram, linux')
    running_build = Build.new(:plan => running_plan)
    slave.stubs(:running_builds).returns([running_build])
    
    plan = Plan.new(:requirements => '2 gb ram, linux')
    build = Build.new(:plan => plan)
    Slave.expects(:least_busy).returns(mock(:find => [slave]))
    assert_nil Slave.find_free_slave_for(build)
  end
  
  test "should clean up environment before save" do
    slave = Slave.new(:environment_variables => { 1 => { 'key' => 'foo', 'value' => 'bar' }, 2 => { 'key' => nil, 'value' => nil } })
    slave.send(:cleanup_environment)
    assert_equal({ 1 => { 'key' => 'foo', 'value' => 'bar' }}, slave.environment_variables)
  end
  
  test "should use name as param" do
    assert_equal 'some_slave', Slave.new(:name => 'some_slave').to_param
  end

  test "should find slave by name" do
    Slave.expects(:find_by_name!).with("some_plan")
    Slave.from_param!("some_plan")
  end
end
