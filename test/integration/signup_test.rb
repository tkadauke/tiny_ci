require_relative "../test_helper"

class SignupTest < ActionDispatch::IntegrationTest
  test "should auto-login anonymous user after signup and redirect to root" do
    User.create!(login: "existing_admin", password: "password", password_confirmation: "password",
                 email: "existing_admin@example.com", role: "admin")

    assert_difference "User.count" do
      post users_path, params: { user: { login: "bob", password: "foobar",
                                         password_confirmation: "foobar",
                                         email: "bob@example.com" } }
    end

    bob = User.find_by!(login: "bob")
    assert_equal bob.id, session[:user_id]
    assert_redirected_to root_path
    assert_not_nil flash[:notice]
  end

  test "should not change session when admin creates user while logged in" do
    admin = User.create!(login: "admin", password: "password", password_confirmation: "password",
                         email: "admin@example.com", role: "admin")
    post login_path, params: { user_session: { login: "admin", password: "password" } }
    assert_equal admin.id, session[:user_id]

    assert_difference "User.count" do
      post users_path, params: { user: { login: "carol", password: "foobar",
                                         password_confirmation: "foobar",
                                         email: "carol@example.com" } }
    end

    assert_equal admin.id, session[:user_id]
    assert_redirected_to users_path
    assert_not_nil flash[:notice]
  end
end
