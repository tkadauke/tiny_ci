class Api::BaseController < ApplicationController
  skip_forgery_protection
  wrap_parameters false

  private

  def require_user
    return if logged_in?

    render json: { error: "Login required" }, status: :unauthorized
  end

  def can_edit_account!(user)
    return true if current_user.can_edit_account?(user)

    render json: { error: "Access denied" }, status: :forbidden
    false
  end

  def user_json(user)
    {
      login: user.login,
      email: user.email,
      role: user.role.presence || "user"
    }
  end

  def full_user_json(user)
    user_json(user).merge(
      initial_admin: user.initial_admin?,
      can_assign_roles: user.can_assign_roles?,
      can_create_accounts: user.can_create_accounts?
    )
  end
end
