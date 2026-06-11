require_relative "../../test_helper"

class Api::MeControllerTest < ActionController::TestCase
  test "should show guest current user" do
    get :show, format: :json

    assert_response :success
    body = JSON.parse(response.body)
    assert_equal true, body["guest"]
    assert_equal "initial_admin", body["role"]
    assert_equal true, body["initial_admin"]
    assert_equal true, body["can_configure_slaves"]
  end

  test "should show logged in current user permissions" do
    admin = create_admin
    login_with admin

    get :show, format: :json

    assert_response :success
    body = JSON.parse(response.body)
    assert_equal false, body["guest"]
    assert_equal "admin", body["login"]
    assert_equal "admin", body["role"]
    assert_equal true, body["can_configure_slaves"]
    assert_equal true, body["can_configure_system_variables"]
  end
end
