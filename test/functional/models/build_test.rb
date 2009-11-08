require File.dirname(__FILE__) + '/../../test_helper'

class BuildTest < ActiveSupport::TestCase
  def setup
    @project = Project.create(:name => 'some_project')
    @plan = @project.plans.create(:name => 'some_plan')
  end
  
  test "should act as list" do
    first_build = @plan.builds.create
    second_build = @plan.builds.create
    
    assert second_build.position > first_build.position
  end
  
  test "should act as tree" do
    parent_build = @plan.builds.create
    child_build = parent_build.children.create(:plan => @plan)
    
    assert parent_build.children.reload.include?(child_build)
    assert_equal parent_build, child_build.parent
  end
  
  test "should find all pending builds" do
    build = @plan.builds.create(:status => 'pending')
    
    assert Build.pending.all.include?(build)
  end

  test "should find all finished builds" do
    success_build = @plan.builds.create(:status => 'success')
    fail_build = @plan.builds.create(:status => 'failure')
    running_build = @plan.builds.create(:status => 'running')
    
    assert   Build.finished.all.include?(success_build)
    assert   Build.finished.all.include?(fail_build)
    assert ! Build.finished.all.include?(running_build)
  end
  
  test "should add build output" do
    build = @plan.builds.create
    build.add_to_output(Time.now, 'rake', ["hello", "world"])
    build.flush_output!
    assert build.output =~ /hello/ && build.output =~ /world/
  end
end
