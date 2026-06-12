require_relative "../../../test_helper"

class Api::Admin::WorkersControllerTest < ActionController::TestCase
  def setup
    login_with create_admin
  end

  test "should list workers as json" do
    Worker.create!(
      name: "builder",
      protocol: "ssh",
      hostname: "build.example.com",
      username: "ci",
      base_path: "/var/builds",
      offline: true,
      capabilities: "ruby,linux",
      max_builds: 2,
      environment_variables: { "0" => { "key" => "RAILS_ENV", "value" => "test" } }
    )

    get :index, format: :json

    assert_response :success
    payload = response.parsed_body
    assert_equal 1, payload.length
    assert_equal(
      {
        "name" => "builder",
        "hostname" => "build.example.com",
        "protocol" => "ssh",
        "offline" => true,
        "busy" => false,
        "capabilities" => "ruby,linux",
        "max_builds" => 2,
        "username" => "ci",
        "password" => nil,
        "base_path" => "/var/builds",
        "default_base_path" => TinyCI::Config.base_path,
        "environment_variables" => { "0" => { "key" => "RAILS_ENV", "value" => "test" } }
      },
      payload.first
    )
  end

  test "should show worker by name" do
    worker = Worker.create!(name: "builder", protocol: "localhost")

    get :show, params: { name: worker.name }, format: :json

    assert_response :success
    assert_equal "builder", response.parsed_body["name"]
    assert_nil response.parsed_body["password"]
    assert_nil response.parsed_body["base_path"]
    assert_equal TinyCI::Config.base_path, response.parsed_body["default_base_path"]
  end

  test "should create worker" do
    assert_difference "Worker.count" do
      post :create, params: {
        worker: {
          name: "builder",
          protocol: "localhost",
          environment_variables: {
            "0" => { "key" => "RAILS_ENV", "value" => "test" }
          }
        }
      }, format: :json
    end

    assert_response :created
    assert_equal "builder", response.parsed_body["name"]
    assert_equal(
      { "0" => { "key" => "RAILS_ENV", "value" => "test" } },
      Worker.find_by!(name: "builder").environment_variables
    )
  end

  test "should return validation errors when create fails" do
    assert_no_difference "Worker.count" do
      post :create, params: { worker: { name: "" } }, format: :json
    end

    assert_response :unprocessable_entity
    assert_includes response.parsed_body["errors"], "Name can't be blank"
  end

  test "should update worker" do
    worker = Worker.create!(name: "builder", protocol: "localhost")

    patch :update, params: {
      name: worker.name,
      worker: { name: "builder", protocol: "ssh", max_builds: 3 }
    }, format: :json

    assert_response :success
    assert_equal "ssh", response.parsed_body["protocol"]
    assert_equal 3, worker.reload.max_builds
  end

  test "should return validation errors when update fails" do
    worker = Worker.create!(name: "builder", protocol: "localhost")

    patch :update, params: {
      name: worker.name,
      worker: { protocol: nil }
    }, format: :json

    assert_response :unprocessable_entity
    assert_includes response.parsed_body["errors"], "Protocol can't be blank"
  end

  test "should destroy worker without destroying builds" do
    worker = Worker.create!(name: "builder", protocol: "localhost")
    project = Project.create!(name: "Project")
    plan = project.plans.create!(name: "Plan")
    build = plan.builds.create!(worker: worker)

    assert_difference "Worker.count", -1 do
      assert_no_difference "Build.count" do
        delete :destroy, params: { name: worker.name }, format: :json
      end
    end

    assert_response :success
    assert_equal({ "ok" => true }, response.parsed_body)
    assert_nil build.reload.worker_id
  end
end
