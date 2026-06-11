require_relative "../test_helper"

class BuildBroadcastTest < ActiveSupport::TestCase
  include ActionCable::TestHelper

  test "broadcasts queue payload when build is created" do
    project = Project.create!(name: "default")
    plan = project.plans.create!(name: "some_plan")

    assert_broadcasts("queue", 2) do
      plan.builds.create!(status: "pending")
    end
  end

  test "broadcasts build payload when output changes" do
    project = Project.create!(name: "default")
    plan = project.plans.create!(name: "some_plan")
    build = plan.builds.create!(status: "running")

    assert_broadcasts("build_some_plan_#{build.position}", 2) do
      build.update!(output: "1,rake,hello\n")
    end
  end
end
