require_relative "../test_helper"

class ConfigOptionTest < ActiveSupport::TestCase
  test "should validate" do
    assert_not ConfigOption.new.valid?
    assert     ConfigOption.new(key: "some_key").valid?
  end
end
