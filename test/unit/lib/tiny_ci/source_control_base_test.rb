require_relative "../../../test_helper"

class TinyCI::SourceControl::BaseTest < ActiveSupport::TestCase
  class TestSourceControl < TinyCI::SourceControl::Base
  end

  test "should initialize" do
    TestSourceControl.new(stub, {})
  end
end
