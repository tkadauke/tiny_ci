require File.dirname(__FILE__) + '/../test_helper'

class PlanTest < ActiveSupport::TestCase
  test "should create build" do
    plan = Plan.new
    plan.builds.expects(:create).with(:status => 'pending', :parameters => {})
    plan.build!
  end
  
  test "should be buildable if there is no other build for this plan" do
    plan = Plan.new
    plan.running_builds.expects(:empty?).returns(true)
    assert plan.buildable?
  end
  
  test "should not be buildable if there is another running build for this plan" do
    plan = Plan.new
    plan.running_builds.expects(:empty?).returns(false)
    assert ! plan.buildable?
  end
  
  test "should use name as param" do
    plan = Plan.new(:name => 'some_plan')
    assert_equal 'some_plan', plan.to_param
  end
end
