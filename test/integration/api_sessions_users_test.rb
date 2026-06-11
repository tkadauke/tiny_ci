require "test_helper"

class ApiSessionsUsersTest < ActionDispatch::IntegrationTest
  setup do
    User.delete_all
  end

  test "initial admin signup creates an admin and logs in" do
    post api_users_path, params: signup_params("root"), as: :json

    assert_response :created
    assert_equal "root", json_response["login"]
    assert_equal "admin", json_response["role"]
    assert_equal "root", User.find(session_user_id).login
  end

  test "public signup defaults to user and logs in" do
    create_user(login: "existing")

    post api_users_path, params: signup_params("bob"), as: :json

    assert_response :created
    assert_equal "user", json_response["role"]
    assert_equal "bob", User.find(session_user_id).login
  end

  test "logged in normal user signup cannot assign requested role" do
    user = create_user(login: "alice")
    log_in_as(user)

    post api_users_path, params: signup_params("bob").merge(role: "admin"), as: :json

    assert_response :created
    assert_equal "user", json_response["role"]
    assert_equal "user", User.find_by!(login: "bob").role
    assert_equal "alice", User.find(session_user_id).login
  end

  test "admin signup keeps the admin logged in" do
    admin = create_admin
    log_in_as(admin)

    post api_users_path, params: signup_params("bob"), as: :json

    assert_response :created
    assert_equal "user", json_response["role"]
    assert_equal "user", User.find_by!(login: "bob").role
    assert_equal "admin", User.find(session_user_id).login
  end

  test "login succeeds with full user json" do
    create_admin(login: "admin", password: "secret", password_confirmation: "secret")

    post api_session_path, params: { login: "admin", password: "secret" }, as: :json

    assert_response :success
    assert_equal "admin", json_response["login"]
    assert_equal "admin", json_response["role"]
    assert_equal true, json_response["can_assign_roles"]
    assert_equal "admin", User.find(session_user_id).login
  end

  test "login failure returns generic 422 error" do
    create_user(login: "alice", password: "secret", password_confirmation: "secret")

    post api_session_path, params: { login: "alice", password: "wrong" }, as: :json

    assert_response :unprocessable_content
    assert_equal({ "error" => "Invalid login or password" }, json_response)
    assert_nil session_user_id
  end

  test "logout resets the session" do
    user = create_user(login: "alice")
    log_in_as(user)

    delete api_session_path, as: :json

    assert_response :success
    assert_equal({ "ok" => true }, json_response)
    assert_nil session_user_id
  end

  test "profile fetch is public" do
    create_user(login: "alice", email: "alice@example.com")

    get api_user_path("alice"), as: :json

    assert_response :success
    assert_equal(
      { "login" => "alice", "email" => "alice@example.com", "role" => "user" },
      json_response
    )
  end

  test "users index requires login and returns compact users" do
    user = create_user(login: "alice", email: "alice@example.com")

    get api_users_path, as: :json
    assert_response :unauthorized

    log_in_as(user)
    get api_users_path, as: :json

    assert_response :success
    assert_equal [{ "login" => "alice", "email" => "alice@example.com", "role" => "user" }], json_response
  end

  test "self edit updates email and ignores role" do
    user = create_user(login: "alice")
    log_in_as(user)

    patch api_user_path("alice"), params: { email: "new@example.com", role: "admin" }, as: :json

    assert_response :success
    assert_equal "new@example.com", json_response["email"]
    assert_equal "user", json_response["role"]
    user.reload
    assert_equal "new@example.com", user.email
    assert_equal "user", user.role
  end

  test "admin can edit another user's role" do
    admin = create_admin
    user = create_user(login: "alice")
    log_in_as(admin)

    patch api_user_path(user.login), params: { role: "admin" }, as: :json

    assert_response :success
    assert_equal "admin", json_response["role"]
    assert_equal "admin", user.reload.role
  end

  private

  def signup_params(login)
    {
      login: login,
      email: "#{login}@example.com",
      password: "password",
      password_confirmation: "password"
    }
  end

  def create_user(attributes = {})
    login = attributes[:login] || "alice"
    User.create!(
      {
        login: login,
        email: "#{login}@example.com",
        password: "password",
        password_confirmation: "password",
        role: "user"
      }.merge(attributes)
    )
  end

  def create_admin(attributes = {})
    create_user({ login: "admin", role: "admin" }.merge(attributes))
  end

  def log_in_as(user)
    post api_session_path, params: { login: user.login, password: "password" }, as: :json
    assert_response :success
  end

  def json_response
    JSON.parse(response.body)
  end

  def session_user_id
    session[:user_id]
  end
end
