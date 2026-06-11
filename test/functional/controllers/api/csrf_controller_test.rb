require_relative "../../test_helper"

class Api::CsrfControllerTest < ActionController::TestCase
  test "should return csrf token" do
    get :token

    assert_response :success
    assert_not_empty JSON.parse(@response.body)["token"]
  end
end
