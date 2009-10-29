require File.dirname(__FILE__) + '/../../../test_helper'

class SimpleCI::Scheduler::ClientTest < ActiveSupport::TestCase
  def teardown
    SimpleCI::Scheduler::Client.instance_variable_set(:@server, nil)
  end
  
  test "should stop build" do
    DRb.expects(:start_service)
    DRbObject.expects(:new).returns(mock(:stop))
    
    SimpleCI::Scheduler::Client.stop(stub)
  end
end
