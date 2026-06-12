require_relative "../../test_helper"

class Api::MeControllerTest < ActionController::TestCase
  test "should show guest current user" do
    get :show, format: :json

    assert_response :success
    body = JSON.parse(response.body)
    assert_equal true, body["guest"]
    assert_equal "en", body["locale"]
    assert_nil body["login"]
    assert_nil body["email"]
    assert_equal "initial_admin", body["role"]
    assert_equal true, body["initial_admin"]
    assert_equal true, body["can_configure_workers"]
  end

  test "should show logged in current user permissions" do
    admin = create_admin
    login_with admin

    get :show, format: :json

    assert_response :success
    body = JSON.parse(response.body)
    assert_equal false, body["guest"]
    assert_equal "admin", body["login"]
    assert_equal "admin@example.com", body["email"]
    assert_equal "admin", body["role"]
    assert_equal true, body["can_configure_workers"]
    assert_equal true, body["can_configure_system_variables"]
  end

  test "should return current user payload" do
    user = create_user
    login_with user

    get :show

    assert_response :success
    assert_equal(
      {
        "guest" => false,
        "locale" => "en",
        "login" => "alice",
        "email" => "alice@example.com",
        "role" => "user",
        "initial_admin" => false,
        "can_configure_workers" => false,
        "can_configure_system_variables" => false,
        "can_create_accounts" => false,
        "can_create_projects" => true,
        "can_edit_projects" => true,
        "can_create_plans" => false,
        "can_edit_plans" => false,
        "can_destroy_plans" => false
      },
      JSON.parse(@response.body)
    )
  end

  test "should return admin capabilities" do
    admin = create_admin
    login_with admin

    get :show

    assert_response :success
    payload = JSON.parse(@response.body)
    assert_equal false, payload["guest"]
    assert_equal "admin", payload["role"]
    assert_equal true, payload["can_configure_workers"]
    assert_equal true, payload["can_configure_system_variables"]
    assert_equal true, payload["can_create_accounts"]
    assert_equal true, payload["can_create_projects"]
    assert_equal true, payload["can_edit_projects"]
    assert_equal true, payload["can_create_plans"]
    assert_equal true, payload["can_edit_plans"]
    assert_equal true, payload["can_destroy_plans"]
  end
end
