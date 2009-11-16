require File.dirname(__FILE__) + '/../test_helper'

class ProjectTest < ActiveSupport::TestCase
  test "should validate" do
    assert validated_project.errors.on(:name)
    assert validated_project(:name => 'some_project').errors.empty?
  end
  
  test "should validate name" do
    assert ! validated_project(:name => 'correct_Name-123').errors.on(:name)
    assert   validated_project(:name => 'incorrect name').errors.on(:name)
    assert   validated_project(:name => 'incorrect.name').errors.on(:name)
    assert   validated_project(:name => '$%&@!').errors.on(:name)
  end
  
  test "should use name as param" do
    assert_equal 'some_project', Project.new(:name => 'some_project').to_param
  end

  test "should find project by name" do
    Project.expects(:find_by_name!).with("some_plan")
    Project.from_param!("some_plan")
  end

private
  def validated_project(attributes = {})
    project = Project.new(attributes)
    project.valid?
    project
  end
end
