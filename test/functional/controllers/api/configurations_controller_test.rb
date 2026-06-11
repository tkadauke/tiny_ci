require_relative "../../test_helper"

class Api::ConfigurationsControllerTest < ActionController::TestCase
  test "should list current user settings options" do
    user = create_user
    login_with user
    user.config.update("growl_host" => "localhost")

    get :options, format: :json

    assert_response :success
    assert_equal(
      [{
        "key" => "growl_host",
        "name" => "Growl Host",
        "description" => "The host name / IP Address of your local machine for Growl notifications.",
        "type" => "String",
        "values" => nil,
        "current_value" => "localhost"
      }],
      response.parsed_body
    )
  end

  test "should update current user settings only" do
    user = create_user(login: "alice")
    other_user = create_user(login: "bob")
    other_user.config.update("growl_host" => "remotehost")
    login_with user

    post :create, params: { config: { "growl_host" => "localhost" } }, format: :json

    assert_response :success
    assert_equal({ "ok" => true }, response.parsed_body)
    assert_equal "localhost", user.reload.config.growl_host
    assert_equal "remotehost", other_user.reload.config.growl_host
  end

  test "should require user" do
    get :options, format: :json

    assert_response :unauthorized
    assert_equal({ "error" => "Not authenticated" }, response.parsed_body)
  end
end
