require "test_helper"

class QueueChannelTest < ActionCable::Channel::TestCase
  test "subscribes to queue and broadcasts initial state" do
    assert_broadcasts("queue", 1) do
      subscribe
    end

    assert subscription.confirmed?
    assert_has_stream "queue"
  end
end
