require File.dirname(__FILE__) + '/../test_helper'

class ProjectTest < ActiveSupport::TestCase
  test "should create build" do
    project = Project.new
    project.builds.expects(:create).with(:status => 'pending')
    project.build!
  end
  
  test "should be buildable if there is no other build for this project" do
    project = Project.new
    project.running_builds.expects(:empty?).returns(true)
    assert project.buildable?
  end
  
  test "should not be buildable if there is another running build for this project" do
    project = Project.new
    project.running_builds.expects(:empty?).returns(false)
    assert ! project.buildable?
  end
  
  test "should use name as param" do
    project = Project.new(:name => 'some_project')
    assert_equal 'some_project', project.to_param
  end
end
