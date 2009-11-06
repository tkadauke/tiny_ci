require File.dirname(__FILE__) + '/../../../test_helper'

class TinyCI::Scheduler::ServerTest < ActiveSupport::TestCase
  def setup
    TinyCI::Scheduler::Server.any_instance.stubs(:trap)
  end
  
  test "should start build" do
    TinyCI::Scheduler::Server.instance.expects(:fork)
    build = stub(:id => 7)
    build.expects(:update_attributes).with(has_entry(:status => 'running'))
    
    TinyCI::Scheduler::Server.instance.start(build)
  end

  test "should stop build" do
    TinyCI::Scheduler::Server.instance.stubs(:processes).returns({ 7 => 1234 })
    Process.expects(:kill).with('TERM', 1234)
    build = stub(:id => 7)
    Build.expects(:find).with(7).returns(build)
    build.expects(:update_attributes).with(has_entry(:status => 'canceled'))
    
    TinyCI::Scheduler::Server.instance.stop(build.id)
  end
  
  test "should build children if parent build is finished" do
    plan = stub(:has_children? => true)
    Build.stubs(:find).returns(stub(:plan_id => 7, :waiting? => true))
    Plan.stubs(:find).returns(plan)
    
    plan.expects(:build_children!)
    TinyCI::Scheduler::Server.instance.finished(7)
  end
  
  test "should assign pending build to best free slave" do
    pending_build = stub(:buildable? => true)
    slave = stub
    
    Build.expects(:pending).returns(mock(:find => [pending_build]))
    Slave.expects(:find_free_slave_for).with(pending_build).returns(slave)
    pending_build.expects(:assign_to!).with(slave)
    
    TinyCI::Scheduler::Server.instance.expects(:start).with(pending_build)
    TinyCI::Scheduler::Server.instance.schedule!
  end
  
  test "should do nothing if no build is pending" do
    slave = stub
    
    Build.expects(:pending).returns(mock(:find => []))
    Slave.expects(:find_free_slave_for).never
    
    TinyCI::Scheduler::Server.instance.schedule!
  end
  
  test "should swallow any exception when scheduling" do
    slave = stub
    
    Build.expects(:pending).raises('oh noes')
    
    TinyCI::Scheduler::Server.instance.stubs(:puts)
    assert_nothing_raised do
      TinyCI::Scheduler::Server.instance.schedule!
    end
  end
end
