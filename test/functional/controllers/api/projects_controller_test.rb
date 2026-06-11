require_relative "../../test_helper"

module Api
  class ProjectsControllerTest < ActionController::TestCase
    test "lists projects as json" do
      project = Project.create!(name: "some_project", description: "A project")

      get :index

      assert_response :success
      assert_equal [
        {
          "id" => project.id,
          "name" => "some_project",
          "description" => "A project"
        }
      ], response.parsed_body
    end

    test "creates project when permitted" do
      login_with create_user

      assert_difference "Project.count" do
        post :create, params: { project: { name: "some_project", description: "A project" } }
      end

      assert_response :created
      assert_equal "some_project", response.parsed_body["name"]
    end

    test "does not create project when forbidden" do
      create_user

      assert_no_difference "Project.count" do
        post :create, params: { project: { name: "some_project" } }
      end

      assert_response :forbidden
      assert_equal ["Access denied"], response.parsed_body["errors"]
    end

    test "returns validation errors for invalid project" do
      login_with create_user

      assert_no_difference "Project.count" do
        post :create, params: { project: { name: "" } }
      end

      assert_response :unprocessable_content
      assert_includes response.parsed_body["errors"], "Name can't be blank"
    end

    test "updates project when permitted" do
      login_with create_user
      project = Project.create!(name: "some_project")

      patch :update, params: { project_id: project.name, project: { description: "Changed" } }

      assert_response :success
      assert_equal "Changed", response.parsed_body["description"]
      assert_equal "Changed", project.reload.description
    end

    test "destroys project when permitted" do
      login_with create_admin
      project = Project.create!(name: "some_project")

      assert_difference "Project.count", -1 do
        delete :destroy, params: { project_id: project.name }
      end

      assert_response :success
      assert_equal true, response.parsed_body["ok"]
    end

    test "does not destroy project when forbidden" do
      login_with create_user
      project = Project.create!(name: "some_project")

      assert_no_difference "Project.count" do
        delete :destroy, params: { project_id: project.name }
      end

      assert_response :forbidden
    end
  end
end
