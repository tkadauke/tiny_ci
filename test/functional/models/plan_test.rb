require File.dirname(__FILE__) + '/../../test_helper'

class PlanTest < ActiveSupport::TestCase
  def setup
    @project = Project.create(:name => 'some_project')
  end
  
  test "should find running builds" do
    plan = @project.plans.create(:name => 'some_plan')
    build = plan.builds.create(:status => 'running')
    
    assert plan.running_builds.include?(build)
  end
  
  test "should find pending builds" do
    plan = @project.plans.create(:name => 'some_plan')
    build = plan.builds.create(:status => 'pending')
    
    assert plan.pending_builds.include?(build)
  end
  
  test "should find weather relevant builds" do
    plan = @project.plans.create(:name => 'some_plan')
    build = plan.builds.create(:status => 'success', :finished_at => 2.minutes.ago)
    
    assert plan.weather_relevant_builds.include?(build)
  end
  
  test "should find last finished build" do
    plan = @project.plans.create(:name => 'some_plan')
    build = plan.builds.create(:status => 'success', :finished_at => 2.minutes.ago)
    
    assert_equal build, plan.last_finished_build
  end
  
  test "should find last successful build" do
    plan = @project.plans.create(:name => 'some_plan')
    build = plan.builds.create(:status => 'success', :finished_at => 2.minutes.ago)
    
    assert_equal build, plan.last_successful_build
  end
  
  test "should find last failed build with status failure" do
    plan = @project.plans.create(:name => 'some_plan')
    build = plan.builds.create(:status => 'failure', :finished_at => 2.minutes.ago)
    assert_equal build, plan.last_failed_build
  end
  
  test "should find last failed build with status error" do
    plan = @project.plans.create(:name => 'some_plan')
    build = plan.builds.create(:status => 'error', :finished_at => 2.minutes.ago)
    assert_equal build, plan.last_failed_build
  end
  
  test "should not find last failed build with status stopped" do
    plan = @project.plans.create(:name => 'some_plan')
    build = plan.builds.create(:status => 'stopped', :finished_at => 2.minutes.ago)
    assert_not_equal build, plan.last_failed_build
  end
  
  test "should find next plan" do
    plan = @project.plans.create(:name => 'some_plan')
    next_plan = @project.plans.create(:name => 'next_plan', :previous => plan)
    
    assert_equal next_plan, plan.next
  end
  
  test "should act as tree" do
    parent_plan = @project.plans.create(:name => 'some_plan')
    child_plan = parent_plan.children.create(:project => @project, :name => 'child_plan')
    
    assert parent_plan.children.reload.include?(child_plan)
    assert_equal parent_plan, child_plan.parent
  end
  
  test "should build" do
    plan = @project.plans.create(:name => 'some_plan')
    
    assert_difference 'Build.count' do
      build = plan.build!
      assert_equal 'pending', build.status
    end
  end
  
  test "should build children" do
    plan = @project.plans.create(:name => 'some_plan')
    child_plan = plan.children.create(:project => @project, :name => 'child_plan')
    parent_build = plan.build!
    
    assert_difference 'Build.count' do
      plan.build_children!(parent_build)
    end
  end
  
  test "should build next" do
    plan = @project.plans.create(:name => 'some_plan')
    next_plan = @project.plans.create(:name => 'next_plan', :previous => plan)
    parent_build = plan.build!
    
    assert_difference 'Build.count' do
      plan.build_next!(parent_build)
    end
  end
end
