require File.dirname(__FILE__) + '/../test_helper'

class ProjectsControllerTest < ActionController::TestCase
  test "should render index page" do
    Project.create(:name => 'some_project')
    
    get 'index'
    assert_response :success
  end
  
  test "should show new" do
    get 'new'
    assert_response :success
  end
  
  test "should not show new to unauthorized user" do
    create_user
    
    get 'new'
    assert_access_denied
  end
  
  test "should redirect to plans page on show action" do
    project = Project.create(:name => 'some_project')
    
    get 'show', :id => project.name
    assert_response :redirect
  end
  
  test "should clone project" do
    project = Project.create(:name => 'some_project')
    
    get 'new', :clone => project.name
    assert_response :success
  end
  
  test "should create project" do
    assert_difference 'Project.count' do
      post 'create', :project => { :name => 'some_project' }
      assert_response :redirect
      assert_not_nil flash[:notice]
    end
  end
  
  test "should not create project for unauthorized user" do
    create_user
    
    assert_no_difference 'Project.count' do
      post 'create', :project => { :name => 'some_project' }
      assert_access_denied
    end
  end

  test "should not create invalid project" do
    assert_no_difference 'Project.count' do
      post 'create'
      assert_response :success
      assert_nil flash[:notice]
    end
  end

  test "should show edit" do
    project = Project.create(:name => 'some_project')
    
    get 'edit', :id => project.name
    assert_response :success
  end
  
  test "should not show edit to unauthorized user" do
    create_user
    project = Project.create(:name => 'some_project')
    
    get 'edit', :id => project.name
    assert_access_denied
  end
  
  test "should update project" do
    project = Project.create(:name => 'some_project')

    post 'update', :id => project.name, :project => { :name => 'some_project' }
    assert_response :redirect
    assert_not_nil flash[:notice]
  end

  test "should not update project for unauthorized user" do
    create_user
    project = Project.create(:name => 'some_project')

    post 'update', :id => project.name, :project => { :name => 'some_project' }
    assert_access_denied
  end

  test "should not update invalid project" do
    project = Project.create(:name => 'some_project')
    project_two = Project.create(:name => 'some_project_two')

    post 'update', :id => project.name, :project => { :name => 'some_project_two' }
    assert_response :success
    assert_nil flash[:notice]
  end
end
