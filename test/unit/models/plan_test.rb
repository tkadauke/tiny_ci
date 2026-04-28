require_relative "../test_helper"

class PlanTest < ActiveSupport::TestCase
  test "should validate" do
    project = Project.create!(name: "some_project")
    assert validated_plan.errors[:name].any?
    assert validated_plan.errors[:project_id].any?
    assert validated_plan(name: "some_name").errors[:project_id].any?
    assert validated_plan(project: project).errors[:name].any?
    assert validated_plan(name: "some_name", project: project).errors.empty?
  end

  test "should validate name" do
    assert_not validated_plan(name: "correct_Name-123").errors[:name].any?
    assert     validated_plan(name: "incorrect name").errors[:name].any?
    assert     validated_plan(name: "incorrect.name").errors[:name].any?
    assert     validated_plan(name: "$%&@!").errors[:name].any?
  end

  test "should clone plan" do
    original = Plan.new(name: "some_name", project_id: 5, steps: "do_something", repository_url: "/some/url")
    Plan.expects(:find_by!).with(name: "some_name").returns(original)

    clone = Plan.find_for_cloning!("some_name")
    assert_nil clone.name
    assert_equal original.project_id, clone.project_id
    assert_equal original.steps, clone.steps
    assert_equal original.repository_url, clone.repository_url

    assert clone.new_record?
  end

  test "should create child plan" do
    parent = Plan.new(name: "some_name", project_id: 5)
    Plan.expects(:find_by!).with(name: "some_name").returns(parent)

    child = Plan.new_with_parent("some_name")
    assert_equal parent, child.parent

    assert parent.new_record?
  end

  test "should figure out if plan has children" do
    assert_not Plan.new.has_children?

    parent = Plan.new
    parent.expects(:children).returns([stub])
    assert parent.has_children?
  end

  test "should create build" do
    plan = Plan.new
    plan.builds.expects(:create).with({ status: "pending" })
    plan.build!
  end

  test "should create build with starter" do
    user = stub
    plan = Plan.new
    plan.builds.expects(:create).with({ status: "pending", starter: user })
    plan.build!(starter: user)
  end

  test "should build children" do
    plan = Plan.new
    plan.expects(:children).returns([
      stub(build_with_parent_build!: nil),
      stub(build_with_parent_build!: nil)
    ])
    plan.build_children!(stub)
  end

  test "should build with parent build" do
    plan = Plan.new
    build = stub(environment: { "some" => "variable" })
    plan.builds.expects(:create).with({ status: "pending", parameters: { "some" => "variable" }, parent: build })
    plan.build_with_parent_build!(build)
  end

  test "should build next build" do
    plan = Plan.new
    next_plan = Plan.new(parent: plan)
    plan.stubs(:next).returns(next_plan)

    build = stub
    next_plan.expects(:build_with_parent_build!).with(build)

    plan.build_next!(build)
  end

  test "should be buildable if there is no other build for this plan" do
    plan = Plan.new
    plan.running_builds.expects(:empty?).returns(true)
    assert plan.buildable?
  end

  test "should not be buildable if there is another running build for this plan" do
    plan = Plan.new
    plan.running_builds.expects(:empty?).returns(false)
    assert_not plan.buildable?
  end

  test "should use name as param" do
    plan = Plan.new(name: "some_plan")
    assert_equal "some_plan", plan.to_param
  end

  test "should find plan by name" do
    Plan.expects(:find_by!).with(name: "some_plan")
    Plan.from_param!("some_plan")
  end

  test "should find out if build can be manually executed" do
    assert     Plan.new.standalone?
    assert_not Plan.new(parent_id: 5).standalone?
  end

  test "should update build stats" do
    plan = Plan.new
    plan.stubs(:weather_relevant_builds).returns([stub(good?: true), stub(good?: false)])
    plan.stubs(:last_finished_build).returns(stub(status: "success", duration: 30))
    plan.stubs(:last_successful_build).returns(stub(finished_at: 2.minutes.ago))
    plan.stubs(:last_failed_build).returns(stub(finished_at: 4.minutes.ago))

    plan.update_build_stats!

    assert_equal 4, plan.weather
    assert_equal "success", plan.status
    assert_equal 30, plan.last_build_time
    assert plan.last_succeeded_at < 1.minute.ago
    assert plan.last_failed_at < 3.minutes.ago
  end

  test "should only return numbered resources" do
    skip "TinyCI::Resources::Parser is currently a stub — see app/lib/tiny_ci/resources.rb"
  end

  private

  def validated_plan(attributes = {})
    plan = Plan.new(attributes)
    plan.valid?
    plan
  end
end
