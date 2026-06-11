require "test_helper"

class BuildChannelTest < ActionCable::Channel::TestCase
  test "subscribes to build stream" do
    subscribe build_name: "some_plan", build_position: 7

    assert subscription.confirmed?
    assert_has_stream "build_some_plan_7"
  end
end
