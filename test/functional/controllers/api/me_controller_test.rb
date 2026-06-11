require_relative "../../test_helper"

class Api::MeControllerTest < ActionController::TestCase
  test "should return guest payload for guest" do
    get :show

    assert_response :success
    assert_equal({ "guest" => true }, JSON.parse(@response.body))
  end

  test "should return current user payload" do
    user = create_user
    login_with user

    get :show

    assert_response :success
    assert_equal(
      {
        "login" => "alice",
        "email" => "alice@example.com",
        "role" => nil,
        "initial_admin" => false,
        "can_configure_slaves" => false,
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
    assert_equal "admin", payload["role"]
    assert_equal true, payload["can_configure_slaves"]
    assert_equal true, payload["can_configure_system_variables"]
    assert_equal true, payload["can_create_accounts"]
    assert_equal true, payload["can_create_projects"]
    assert_equal true, payload["can_edit_projects"]
    assert_equal true, payload["can_create_plans"]
    assert_equal true, payload["can_edit_plans"]
    assert_equal true, payload["can_destroy_plans"]
  end
end
