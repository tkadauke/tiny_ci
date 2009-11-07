require File.dirname(__FILE__) + '/../test_helper'

class ProjectTest < ActiveSupport::TestCase
  test "should validate" do
    assert ! Project.new.valid?
    assert   Project.new(:name => 'some_project').valid?
  end
  
  test "should use name as param" do
    assert_equal 'some_project', Project.new(:name => 'some_project').to_param
  end
end
