require_relative "../test_helper"

class ActionController::TestCase
  def create_user(attributes = {})
    login = attributes[:login] || "alice"
    defaults = {
      login: login,
      password: "password",
      password_confirmation: "password",
      email: attributes[:email] || "#{login}@example.com"
    }
    User.create!(defaults.merge(attributes))
  end

  def create_admin(attributes = {})
    user = create_user({ login: "admin" }.merge(attributes))
    user.update!(role: "admin")
    user
  end

  def login_with(user)
    @request.session[:user_id] = user.id
  end

  def logout
    @request.session.delete(:user_id)
  end

  def assert_access_denied
    assert_response :redirect
    assert_equal "You can not do that", flash[:error]
  end

  def assert_redirected_to_login
    assert_response :redirect
    assert_redirected_to login_path
  end
end
