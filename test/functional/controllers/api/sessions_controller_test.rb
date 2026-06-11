require_relative "../../test_helper"

class Api::SessionsControllerTest < ActionController::TestCase
  test "should destroy session and return logout flash" do
    user = create_user
    login_with user

    delete :destroy, format: :json

    assert_response :success
    assert_nil session[:user_id]
    body = JSON.parse(response.body)
    assert_equal "notice", body.dig("flash", "type")
    assert_equal "Successfully logged out", body.dig("flash", "message")
  end
end
