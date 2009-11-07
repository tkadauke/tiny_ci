require File.dirname(__FILE__) + '/../../../test_helper'

class TinyCI::Scheduler::MessageQueueTest < ActiveSupport::TestCase
  test "should push command to the back and pop from the front" do
    queue = TinyCI::Scheduler::MessageQueue.new
    first, second = stub, stub
    queue.push :stop, first
    queue.push :stop, second
    assert_equal first, queue.pop.build
  end
  
  test "should return nil when poping from empty queue" do
    queue = TinyCI::Scheduler::MessageQueue.new
    assert_nil queue.pop
  end
  
  test "should find out if queue is empty" do
    assert TinyCI::Scheduler::MessageQueue.new.empty?
  end
end
