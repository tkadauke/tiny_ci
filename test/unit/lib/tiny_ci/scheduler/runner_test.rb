require File.dirname(__FILE__) + '/../../../test_helper'

class TinyCI::Scheduler::RunnerTest < ActiveSupport::TestCase
  def setup
    TinyCI::Scheduler::Runner.any_instance.stubs(:trap)
  end
  
  test "should run" do
    TinyCI::Scheduler::Runner.instance.expects(:run)
    TinyCI::Scheduler::Runner.run
  end
  
  test "should enter event loop" do
    TinyCI::Scheduler::Runner.instance.expects(:poll_messages!)
    TinyCI::Scheduler::Runner.instance.expects(:schedule!)
    TinyCI::Scheduler::Runner.instance.stubs(:loop).yields
    TinyCI::Scheduler::Runner.instance.stubs(:sleep)
    TinyCI::Scheduler::Runner.run
  end
  
  test "should poll messages" do
    build = stub
    TinyCI::Scheduler::Runner.instance.queue.push(:stop, build)
    TinyCI::Scheduler::Runner.instance.expects(:stop).with(build)
    TinyCI::Scheduler::Runner.instance.poll_messages!
  end
  
  test "should start build" do
    TinyCI::Scheduler::Runner.instance.expects(:fork)
    build = stub(:id => 7)
    build.expects(:update_attributes).with(has_entry(:status => 'running'))
    
    TinyCI::Scheduler::Runner.instance.start(build)
  end

  test "should stop build" do
    TinyCI::Scheduler::Runner.instance.stubs(:processes).returns({ 7 => 1234 })
    Process.expects(:kill).with('TERM', 1234)
    build = stub(:id => 7)
    build.expects(:update_attributes).with(has_entry(:status => 'stopped'))
    
    TinyCI::Scheduler::Runner.instance.stop(build)
  end
  
  test "should cancel build" do
    TinyCI::Scheduler::Runner.instance.stubs(:processes).returns({ 7 => nil })
    build = stub(:id => 7)
    build.expects(:update_attributes).with(has_entry(:status => 'canceled'))
    
    TinyCI::Scheduler::Runner.instance.stop(build)
  end
  
  test "should build children if parent build is finished" do
    plan = stub(:has_children? => true)
    Build.stubs(:find).returns(stub(:plan_id => 7, :waiting? => true))
    Plan.stubs(:find).returns(plan)
    
    plan.expects(:build_children!)
    TinyCI::Scheduler::Runner.instance.finished(7)
  end
  
  test "should assign pending build to best free slave" do
    pending_build = stub(:buildable? => true)
    slave = stub
    
    Build.expects(:pending).returns(mock(:find => [pending_build]))
    Slave.expects(:find_free_slave_for).with(pending_build).returns(slave)
    pending_build.expects(:assign_to!).with(slave)
    
    TinyCI::Scheduler::Runner.instance.expects(:start).with(pending_build)
    TinyCI::Scheduler::Runner.instance.schedule!
  end
  
  test "should do nothing if no build is pending" do
    slave = stub
    
    Build.expects(:pending).returns(mock(:find => []))
    Slave.expects(:find_free_slave_for).never
    
    TinyCI::Scheduler::Runner.instance.schedule!
  end
  
  test "should swallow any exception when scheduling" do
    slave = stub
    
    Build.expects(:pending).raises('oh noes')
    
    TinyCI::Scheduler::Runner.instance.stubs(:puts)
    assert_nothing_raised do
      TinyCI::Scheduler::Runner.instance.schedule!
    end
  end
end
