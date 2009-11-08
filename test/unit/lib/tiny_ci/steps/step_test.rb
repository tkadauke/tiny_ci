require File.dirname(__FILE__) + '/../../../test_helper'

class TinyCI::Steps::StepTest < ActiveSupport::TestCase
  class TestStep < TinyCI::Steps::Step
  end
  
  test "should log step before executing" do
    build = stub
    step = TestStep.new(build)
    step.expects(:puts).with(regexp_matches(/TestStep/))
    step.expects(:execute!)
    step.run!
  end
end
