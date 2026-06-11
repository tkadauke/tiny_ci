require_relative "../../../test_helper"

class Api::Admin::SlavesControllerTest < ActionController::TestCase
  def setup
    login_with create_admin
  end

  test "should list slaves as json" do
    Slave.create!(
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
        "base_path" => "/var/builds",
        "environment_variables" => { "0" => { "key" => "RAILS_ENV", "value" => "test" } }
      },
      payload.first
    )
  end

  test "should show slave by name" do
    slave = Slave.create!(name: "builder", protocol: "localhost")

    get :show, params: { name: slave.name }, format: :json

    assert_response :success
    assert_equal "builder", response.parsed_body["name"]
  end

  test "should create slave" do
    assert_difference "Slave.count" do
      post :create, params: {
        slave: {
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
      Slave.find_by!(name: "builder").environment_variables
    )
  end

  test "should return validation errors when create fails" do
    assert_no_difference "Slave.count" do
      post :create, params: { slave: { name: "" } }, format: :json
    end

    assert_response :unprocessable_entity
    assert_includes response.parsed_body["errors"], "Name can't be blank"
  end

  test "should update slave" do
    slave = Slave.create!(name: "builder", protocol: "localhost")

    patch :update, params: {
      name: slave.name,
      slave: { name: "builder", protocol: "ssh", max_builds: 3 }
    }, format: :json

    assert_response :success
    assert_equal "ssh", response.parsed_body["protocol"]
    assert_equal 3, slave.reload.max_builds
  end

  test "should return validation errors when update fails" do
    slave = Slave.create!(name: "builder", protocol: "localhost")

    patch :update, params: {
      name: slave.name,
      slave: { protocol: nil }
    }, format: :json

    assert_response :unprocessable_entity
    assert_includes response.parsed_body["errors"], "Protocol can't be blank"
  end

  test "should destroy slave without destroying builds" do
    slave = Slave.create!(name: "builder", protocol: "localhost")
    project = Project.create!(name: "Project")
    plan = project.plans.create!(name: "Plan")
    build = plan.builds.create!(slave: slave)

    assert_difference "Slave.count", -1 do
      assert_no_difference "Build.count" do
        delete :destroy, params: { name: slave.name }, format: :json
      end
    end

    assert_response :success
    assert_equal({ "ok" => true }, response.parsed_body)
    assert_nil build.reload.slave_id
  end
end
