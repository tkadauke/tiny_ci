require_relative "../test_helper"

# Integration coverage for the role-based authorization layer in
# `ApplicationController` and the per-role `can_*?` predicates.
#
# Without these tests, a future change to `Role::*` modules,
# `current_user`, or the `can_X!` method_missing dispatcher in
# `ApplicationController` could silently grant privilege escalation
# (regular users self-promoting to admin, guests editing config, etc.)
# and the rest of the suite would still go green.
class AuthorizationTest < ActionDispatch::IntegrationTest
  PASSWORD = "password"

  setup do
    @regular = create_user(login: "regular")
    @other   = create_user(login: "other")
    @admin   = create_admin(login: "boss")
  end

  # --- Helpers ------------------------------------------------------------

  def create_user(attrs)
    User.create!(
      login: attrs[:login],
      password: PASSWORD,
      password_confirmation: PASSWORD,
      email: "#{attrs[:login]}@example.com"
    )
  end

  def create_admin(attrs)
    user = create_user(attrs)
    user.update!(role: "admin")
    user
  end

  def login_as(user)
    post login_path, params: { user_session: { login: user.login, password: PASSWORD } }
    assert_response :redirect, "expected login for #{user.login.inspect} to redirect"
  end

  def logout
    delete logout_path
  end

  def assert_access_denied
    assert_redirected_to root_path
    assert_equal "You can not do that", flash[:error]
  end

  # Controllers gated by `before_action :require_user` redirect guests
  # to /login *before* any role check fires, so the access_denied flash
  # never appears. Use this for endpoints behind require_user.
  def assert_redirected_to_login
    assert_redirected_to login_path
  end

  # --- Admin-only routes reject regular users ----------------------------

  test "should reject regular user creating a slave" do
    login_as @regular

    assert_no_difference "Slave.count" do
      post admin_slaves_path,
           params: { slave: { name: "rogue", protocol: "localhost" } }
    end
    assert_access_denied
  end

  test "should reject regular user updating system configuration" do
    login_as @regular

    post admin_configuration_path, params: { config: { "base_path" => "/pwned" } }
    assert_access_denied
  end

  test "should reject regular user destroying a slave" do
    slave = Slave.create!(name: "victim", protocol: "localhost")
    login_as @regular

    assert_no_difference "Slave.count" do
      delete admin_slave_path(slave.name)
    end
    assert_access_denied
  end

  # --- Cross-account edits ------------------------------------------------

  test "should reject regular user editing another users account" do
    login_as @regular

    get edit_user_path(@other)
    assert_access_denied
  end

  test "should reject regular user updating another users account" do
    login_as @regular
    original_email = @other.email

    patch user_path(@other),
          params: { user: { email: "hijacked@example.com" } }

    assert_access_denied
    assert_equal original_email, @other.reload.email,
                 "regular user must not be able to mutate another account"
  end

  # --- Self privilege escalation -----------------------------------------

  test "should not allow regular user to self-promote via role param" do
    login_as @regular
    assert_nil @regular.role, "fixture invariant: regular user starts without a role"

    patch user_path(@regular),
          params: { user: { email: @regular.email, role: "admin" } }

    assert_redirected_to user_path(@regular)
    @regular.reload
    assert_nil @regular.role,
               "regular user must not be able to assign themselves a role; " \
               "got #{@regular.role.inspect}"
  end

  test "should not allow regular user to promote another user" do
    login_as @regular

    patch user_path(@other),
          params: { user: { role: "admin" } }

    assert_access_denied
    assert_nil @other.reload.role
  end

  test "should allow admin to assign roles to other users" do
    login_as @admin

    patch user_path(@other),
          params: { user: { email: @other.email, role: "admin" } }

    assert_redirected_to user_path(@other)
    assert_equal "admin", @other.reload.role
  end

  # --- Guest (unauthenticated) handling ----------------------------------

  test "should redirect guest to login from settings page" do
    get settings_path
    assert_redirected_to login_path
  end

  test "should deny guest from admin slave creation" do
    assert_no_difference "Slave.count" do
      post admin_slaves_path,
           params: { slave: { name: "ghost", protocol: "localhost" } }
    end
    assert_redirected_to_login
  end

  test "should deny guest from updating system configuration" do
    post admin_configuration_path, params: { config: { "base_path" => "/x" } }
    assert_redirected_to_login
  end

  test "should deny guest from editing a user account" do
    get edit_user_path(@regular)
    assert_redirected_to_login
  end

  test "should deny guest from updating a user account" do
    original_email = @regular.email

    patch user_path(@regular), params: { user: { email: "guest@example.com" } }

    assert_redirected_to_login
    assert_equal original_email, @regular.reload.email
  end

  # --- Project / plan write actions are user-level, not admin-only -------
  #
  # These are the closest thing to "manager-level" actions in TinyCI: any
  # logged-in user with Role::User can manage projects and plans, but a
  # guest cannot. This documents that role boundary so a future change that
  # accidentally tightens or loosens it is caught.

  test "should allow regular user to create a project" do
    login_as @regular

    assert_difference "Project.count" do
      post projects_path, params: { project: { name: "from-regular-user" } }
    end
    assert_response :redirect
  end

  test "should deny guest from creating a project" do
    assert_no_difference "Project.count" do
      post projects_path, params: { project: { name: "from-guest" } }
    end
    assert_access_denied
  end
end
