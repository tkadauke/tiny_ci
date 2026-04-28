require File.dirname(__FILE__) + '/../../../test_helper'

class TinyCI::Scheduler::ClientTest < ActiveSupport::TestCase
  def teardown
    TinyCI::Scheduler::Client.instance_variable_set(:@server, nil)
  end
  
  test "should stop build" do
    DRb.expects(:start_service)
    DRbObject.expects(:new).returns(mock(:stop))
    
    TinyCI::Scheduler::Client.stop(stub(:id => 7))
  end
end
