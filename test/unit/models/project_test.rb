require_relative "../test_helper"

class ProjectTest < ActiveSupport::TestCase
  test "should validate" do
    assert validated_project.errors[:name].any?
    assert validated_project(name: "some_project").errors.empty?
  end

  test "should validate name" do
    assert_not validated_project(name: "correct_Name-123").errors[:name].any?
    assert     validated_project(name: "incorrect name").errors[:name].any?
    assert     validated_project(name: "incorrect.name").errors[:name].any?
    assert     validated_project(name: "$%&@!").errors[:name].any?
  end

  test "should use name as param" do
    assert_equal "some_project", Project.new(name: "some_project").to_param
  end

  test "should find project by name" do
    Project.expects(:find_by!).with(name: "some_plan")
    Project.from_param!("some_plan")
  end

  private

  def validated_project(attributes = {})
    project = Project.new(attributes)
    project.valid?
    project
  end
end
