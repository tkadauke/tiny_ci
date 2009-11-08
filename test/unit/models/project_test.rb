require File.dirname(__FILE__) + '/../test_helper'

class ProjectTest < ActiveSupport::TestCase
  test "should validate" do
    assert ! Project.new.valid?
    assert   Project.new(:name => 'some_project').valid?
  end
  
  test "should use name as param" do
    assert_equal 'some_project', Project.new(:name => 'some_project').to_param
  end

  test "should find project by name" do
    Project.expects(:find_by_name!).with("some_plan")
    Project.from_param!("some_plan")
  end
end
