require 'test_helper'

class BuildsControllerTest < ActionController::TestCase
  test "should render index page" do
    project = Project.create(:name => 'some_project')
    
    get 'index', :project_id => project.name
    assert_response :success
    assert_template 'list'
  end
  
  test "should raise record not found if project not found" do
    assert_raise ActiveRecord::RecordNotFound do
      get 'index', :project_id => nil
    end
  end
  
  test "should render list page" do
    project = Project.create(:name => 'some_project')
    
    get 'list', :project_id => project.name
    assert_response :success
  end
  
  test "should show build" do
    project = Project.create(:name => 'some_project')
    build = project.builds.create(:status => 'success')
    
    get 'show', :project_id => project.name, :id => build.position
    assert_response :success
  end
  
  test "should raise record not found if build does not exist" do
    project = Project.create(:name => 'some_project')
    
    assert_raise ActiveRecord::RecordNotFound do
      get 'show', :project_id => project.name, :id => nil
    end
  end
  
  test "should create build" do
    project = Project.create(:name => 'some_project')
    
    post 'create', :project_id => project.name
    assert_response :redirect
    assert_not_nil flash[:notice]
  end
end
