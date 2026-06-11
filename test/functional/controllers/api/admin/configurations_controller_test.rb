require_relative "../../../test_helper"

class Api::Admin::ConfigurationsControllerTest < ActionController::TestCase
  def setup
    login_with create_admin
  end

  test "should list non hash system configuration options with current values" do
    TinyCI::Config.instance.update("base_path" => "/tmp/builds")

    get :options, format: :json

    assert_response :success
    options = response.parsed_body
    keys = options.map { |option| option["key"] }
    assert_includes keys, "base_path"
    assert_not_includes keys, "environment"

    base_path = options.detect { |option| option["key"] == "base_path" }
    assert_equal "Base Path", base_path["name"]
    assert_equal "String", base_path["type"]
    assert_equal "/tmp/builds", base_path["current_value"]
  end

  test "should update system configuration" do
    post :create, params: { config: { "base_path" => "/some/path" } }, format: :json

    assert_response :success
    assert_equal({ "ok" => true }, response.parsed_body)
    assert_equal "/some/path", TinyCI::Config.base_path
  end

  test "should reject unauthorized users" do
    logout
    login_with create_user

    post :create, params: { config: { "base_path" => "/some/path" } }, format: :json

    assert_response :forbidden
    assert_equal({ "error" => "Access denied" }, response.parsed_body)
  end
end
