require File.dirname(__FILE__) + '/../../../test_helper'

class SimpleCI::Scheduler::ServerTest < ActiveSupport::TestCase
  test "should start build" do
    SimpleCI::Scheduler::Server.instance.expects(:fork)
    build = stub(:id => 7)
    build.expects(:update_attributes).with(:status => 'running')
    
    SimpleCI::Scheduler::Server.instance.start(build)
  end

  test "should stop build" do
    SimpleCI::Scheduler::Server.instance.stubs(:processes).returns({ 7 => 1234 })
    Process.expects(:kill).with('TERM', 1234)
    build = stub(:id => 7)
    Build.expects(:find).with(7).returns(build)
    build.expects(:update_attributes).with(:status => 'canceled')
    
    SimpleCI::Scheduler::Server.instance.stop(build.id)
  end
end
