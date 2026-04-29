require_relative "../../test_helper"

class TimeFormatsTest < ActiveSupport::TestCase
  test "should register a :timestamp Time format" do
    assert Time::DATE_FORMATS.key?(:timestamp), "expected Time::DATE_FORMATS[:timestamp] to be registered"
  end

  test "should format a Time as DD/MM/YYYY HH:MM:SS via to_fs(:timestamp)" do
    time = Time.utc(2026, 4, 28, 14, 5, 9)
    assert_equal "28/04/2026 14:05:09", time.to_fs(:timestamp)
  end
end
