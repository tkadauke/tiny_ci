require File.dirname(__FILE__) + '/../../../test_helper'

class TinyCI::Scheduler::ServerTest < ActiveSupport::TestCase
  test "should push stop message in runner's queue" do
    build = stub
    Build.expects(:find).with(7).returns(build)
    TinyCI::Scheduler::Runner.instance.queue.expects(:push).with(:stop, build)
    TinyCI::Scheduler::Server.instance.stop(7)
  end
end
