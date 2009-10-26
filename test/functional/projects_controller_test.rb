require 'test_helper'

class ProjectsControllerTest < ActionController::TestCase
  test "should render index page" do
    get 'index'
    assert_response :success
    assert_template 'list'
  end
  
  test "should render list page" do
    project = Project.create(:name => 'some_project')
    
    get 'list'
    assert_response :success
  end
  
  test "should show project" do
    project = Project.create(:name => 'some_project')
    
    get 'show', :id => project.name
    assert_response :success
  end
  
  test "should raise record not found if project not found" do
    project = Project.create(:name => 'some_project')
    
    get 'show', :id => project.name
    assert_response :success
  end
  
  test "should show new form" do
    get 'new'
    assert_response :success
  end
  
  test "should show edit form" do
    project = Project.create(:name => 'some_project')
    
    get 'edit', :id => project.name
    assert_response :success
  end
  
  test "should create project" do
    assert_difference 'Project.count' do
      post 'create', :project => { :name => 'some_project' }
      assert_response :redirect
      assert_not_nil flash[:notice]
    end
  end
  
  test "should update project" do
    project = Project.create(:name => 'some_project')
    
    post 'update', :id => project.name, :project => { :name => 'some_project_with_new_name' }
    assert_response :redirect
    assert_not_nil flash[:notice]
  end
end
