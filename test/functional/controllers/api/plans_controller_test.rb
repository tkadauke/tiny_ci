require_relative "../../test_helper"

module Api
  class PlansControllerTest < ActionController::TestCase
    def setup
      @project = Project.create!(name: "default")
      @admin = create_admin
      login_with @admin
    end

    test "lists all plans sorted by project and plan with stats" do
      other_project = Project.create!(name: "alpha")
      beta = @project.plans.create!(name: "beta")
      alpha = other_project.plans.create!(name: "alpha")
      alpha_build = alpha.builds.create!(status: "success", finished_at: 2.days.ago)
      alpha.update_build_stats!

      get :index

      assert_response :success
      plans = response.parsed_body
      assert_equal ["alpha", "beta"], plans.map { |plan| plan["name"] }
      assert_equal other_project.id, plans.first["project"]["id"]
      assert_equal alpha_build.finished_at.as_json, plans.first["last_build_at"]
      assert_equal 0, plans.first["children_count"]
      assert_nil plans.first["previous_plan"]
    end

    test "lists project root plans only" do
      root = @project.plans.create!(name: "root")
      @project.plans.create!(name: "child", parent: root)

      get :project_index, params: { project_id: @project.name }

      assert_response :success
      assert_equal ["root"], response.parsed_body.map { |plan| plan["name"] }
    end

    test "shows plan detail with children and latest finished build" do
      plan = @project.plans.create!(name: "some_plan", steps: "build", repository_url: "git@example/repo")
      option = @project.plans.create!(name: "chain_option")
      child = @project.plans.create!(name: "child_plan", parent: plan)
      build = plan.builds.create!(status: "failure", finished_at: 1.hour.ago)

      get :show, params: { project_id: @project.name, plan_id: plan.name }

      assert_response :success
      body = response.parsed_body
      assert_equal "git@example/repo", body["repository_url"]
      assert_equal "build", body["steps"]
      assert_match %r{/api/projects/default/plans/some_plan/builds\z}, body["commit_hook_url"]
      assert_equal [{ "id" => child.id, "name" => "child_plan" }], body["children"].map { |item| item.slice("id", "name") }
      assert_equal({ "position" => build.position, "status" => "failure" }, body["last_finished_build"])
      assert_equal true, body["can_edit_plan"]
      assert_equal true, body["can_edit_plans"]
      assert_equal true, body["can_create_plans"]
      assert_equal true, body["can_destroy_plan"]
      assert_equal [{ "id" => option.id, "name" => "chain_option" }], body["root_plan_options"]
    end

    test "shows build chain links on plan detail" do
      previous = @project.plans.create!(name: "previous")
      current = @project.plans.create!(name: "current", previous: previous)
      following = @project.plans.create!(name: "following", previous: current)

      get :show, params: { project_id: @project.name, plan_id: current.name }

      assert_response :success
      body = response.parsed_body
      assert_equal({ "id" => previous.id, "name" => "previous" }, body["previous_plan"])
      assert_equal({ "id" => following.id, "name" => "following" }, body["next_plan"])
    end

    test "excludes current root plan from parent and chain options" do
      current = @project.plans.create!(name: "current")
      option = @project.plans.create!(name: "option")

      get :show, params: { project_id: @project.name, plan_id: current.name }

      assert_response :success
      assert_equal [{ "id" => option.id, "name" => "option" }], response.parsed_body["root_plan_options"]
    end

    test "returns blank new plan form data" do
      option = @project.plans.create!(name: "chain_option")

      get :new_form, params: { project_id: @project.name }

      assert_response :success
      body = response.parsed_body
      assert_nil body["plan"]["id"]
      assert_nil body["plan"]["name"]
      assert_nil body["plan"]["parent_id"]
      assert_equal true, body["can_edit_plans"]
      assert_equal [{ "id" => option.id, "name" => "chain_option" }], body["root_plan_options"]
    end

    test "returns clone form data without source name" do
      previous = @project.plans.create!(name: "previous")
      source = @project.plans.create!(
        name: "source",
        description: "Clone me",
        repository_url: "git@example/repo",
        steps: "build",
        requirements: "linux",
        previous: previous
      )

      get :new_form, params: { project_id: @project.name, clone: source.name }

      assert_response :success
      plan = response.parsed_body["plan"]
      assert_nil plan["id"]
      assert_nil plan["name"]
      assert_equal "Clone me", plan["description"]
      assert_equal "git@example/repo", plan["repository_url"]
      assert_equal "build", plan["steps"]
      assert_equal "linux", plan["requirements"]
      assert_equal previous.id, plan["previous_plan_id"]
    end

    test "returns child new plan form data with parent id" do
      parent = @project.plans.create!(name: "parent")

      get :new_form, params: { project_id: @project.name, parent: parent.name }

      assert_response :success
      assert_equal parent.id, response.parsed_body["plan"]["parent_id"]
    end

    test "requires login for plan index" do
      logout

      get :index

      assert_response :unauthorized
      assert_equal ["Login required"], response.parsed_body["errors"]
    end

    test "creates plan when permitted" do
      assert_difference "Plan.count" do
        post :create, params: { project_id: @project.name, plan: { name: "some_plan", description: "A plan" } }
      end

      assert_response :created
      assert_equal "some_plan", response.parsed_body["name"]
      assert_equal "A plan", response.parsed_body["description"]
    end

    test "does not create plan when forbidden" do
      logout
      login_with create_user

      assert_no_difference "Plan.count" do
        post :create, params: { project_id: @project.name, plan: { name: "some_plan" } }
      end

      assert_response :forbidden
    end

    test "ignores steps unless user can edit plans" do
      logout
      user = create_user(login: "bob")
      user.stubs(:can_create_plans?).returns(true)
      @controller.stubs(:current_user).returns(user)
      @controller.stubs(:logged_in?).returns(true)

      post :create, params: { project_id: @project.name, plan: { name: "some_plan", steps: "danger" } }

      assert_response :created
      assert_nil Plan.last.steps
    end

    test "accepts steps for admin" do
      post :create, params: { project_id: @project.name, plan: { name: "some_plan", steps: "build" } }

      assert_response :created
      assert_equal "build", Plan.last.steps
    end

    test "returns validation errors for invalid plan" do
      assert_no_difference "Plan.count" do
        post :create, params: { project_id: @project.name, plan: { name: "" } }
      end

      assert_response :unprocessable_content
      assert_includes response.parsed_body["errors"], "Name can't be blank"
    end

    test "updates plan and clears chain links when parent is present" do
      previous = @project.plans.create!(name: "previous")
      plan = @project.plans.create!(name: "some_plan", previous: previous)
      parent = @project.plans.create!(name: "parent")

      patch :update, params: {
        project_id: @project.name,
        plan_id: plan.name,
        plan: { parent_id: parent.id, previous_plan_id: previous.id }
      }

      assert_response :success
      assert_nil response.parsed_body["previous_plan"]
      assert_nil response.parsed_body["next_plan"]
      assert_equal parent.id, response.parsed_body["parent"]["id"]
      assert_nil plan.reload.previous
    end

    test "updates parent from root-level api payload" do
      plan = @project.plans.create!(name: "some_plan")
      parent = @project.plans.create!(name: "parent")

      patch :update, params: {
        project_id: @project.name,
        plan_id: plan.name,
        parent_id: parent.id
      }

      assert_response :success
      assert_equal parent.id, response.parsed_body["parent_id"]
      assert_equal parent.id, response.parsed_body["parent"]["id"]
      assert_equal parent, plan.reload.parent
    end

    test "clears parent from root-level api payload" do
      parent = @project.plans.create!(name: "parent")
      plan = @project.plans.create!(name: "some_plan", parent: parent)

      patch :update, params: {
        project_id: @project.name,
        plan_id: plan.name,
        parent_id: nil
      }

      assert_response :success
      assert_nil response.parsed_body["parent_id"]
      assert_nil response.parsed_body["parent"]
      assert_nil plan.reload.parent
    end

    test "child plan detail returns no chain links after parent update" do
      previous = @project.plans.create!(name: "previous")
      plan = @project.plans.create!(name: "some_plan", previous: previous)
      following = @project.plans.create!(name: "following", previous: plan)
      parent = @project.plans.create!(name: "parent")

      patch :update, params: {
        project_id: @project.name,
        plan_id: plan.name,
        parent_id: parent.id
      }

      assert_response :success
      body = response.parsed_body
      assert_nil body["previous_plan_id"]
      assert_nil body["previous_plan"]
      assert_nil body["next_plan"]
      assert_nil following.reload.previous
    end

    test "destroys plan when permitted" do
      plan = @project.plans.create!(name: "some_plan")

      assert_difference "Plan.count", -1 do
        delete :destroy, params: { project_id: @project.name, plan_id: plan.name }
      end

      assert_response :success
      assert_equal true, response.parsed_body["ok"]
    end

    test "creates manual build for logged in user" do
      plan = @project.plans.create!(name: "some_plan")

      assert_difference "Build.count" do
        post :create_build, params: { project_id: @project.name, plan_id: plan.name }
      end

      assert_response :created
      build = Build.last
      assert_equal "pending", build.status
      assert_equal @admin, build.starter
      assert_equal build.position, response.parsed_body["build"]["position"]
    end

    test "requires login for manual build" do
      plan = @project.plans.create!(name: "some_plan")
      logout

      assert_no_difference "Build.count" do
        post :create_build, params: { project_id: @project.name, plan_id: plan.name }
      end

      assert_response :unauthorized
    end
  end
end
