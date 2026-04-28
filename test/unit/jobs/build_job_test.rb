require_relative "../test_helper"

class BuildJobTest < ActiveJob::TestCase
  setup do
    @project = Project.create!(name: "demo")
    @plan = Plan.create!(project: @project, name: "main")
  end

  test "performs build! on the build" do
    build = @plan.builds.create!(status: "pending")
    Build.expects(:find).with(build.id).returns(build)
    build.expects(:build!)

    BuildJob.perform_now(build.id)
  end

  test "triggers child builds when parent finishes in waiting state" do
    parent = @plan.builds.create!(status: "waiting")
    parent.stubs(:build!)
    plan_with_children = stub(has_children?: true)
    plan_with_children.expects(:build_children!).with(parent)
    parent.stubs(:plan).returns(plan_with_children)

    Build.expects(:find).with(parent.id).returns(parent)

    BuildJob.perform_now(parent.id)
  end

  test "does not trigger child builds when parent finished but plan has none" do
    build = @plan.builds.create!(status: "success")
    build.stubs(:build!)
    Build.expects(:find).with(build.id).returns(build)

    @plan.expects(:build_children!).never

    BuildJob.perform_now(build.id)
  end
end
