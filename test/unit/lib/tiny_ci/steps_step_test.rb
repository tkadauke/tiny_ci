require_relative "../../../test_helper"

class TinyCI::Steps::StepTest < ActiveSupport::TestCase
  class TestStep < TinyCI::Steps::Step
  end

  test "should log step before executing" do
    build = stub
    step = TestStep.new(build)
    Rails.logger.expects(:info).with(regexp_matches(/TestStep/))
    step.expects(:execute!)
    step.run!
  end
end
