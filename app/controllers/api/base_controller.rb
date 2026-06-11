module Api
  class BaseController < ApplicationController
    skip_before_action :setup_redirect
    skip_forgery_protection
    wrap_parameters false

    rescue_from ActiveRecord::RecordNotFound, with: :render_not_found

    protected

    def require_user
      return true if logged_in?
      return render_json_auth_error("Not authenticated", :unauthorized) if json_request?

      super
    end

    def access_denied!
      return render_json_auth_error("Access denied", :forbidden) if json_request?

      flash[:error] = t("flash.error.access_denied")
      redirect_to root_path
    end

    def method_missing(method, *args)
      if method.to_s =~ /^can_.*\?$/
        if current_user.send(method, *args)
          yield if block_given?
          true
        else
          false
        end
      elsif method.to_s =~ /^can_.*\!$/
        if current_user.send(method.to_s.gsub(/\!$/, "?"), *args)
          yield if block_given?
        else
          access_denied!
        end
      else
        super
      end
    end

    def respond_to_missing?(method, include_private = false)
      method.to_s.match?(/^can_.*[!?]$/) || super
    end

    private

    def can_edit_account!(user)
      return true if current_user.can_edit_account?(user)

      render_json_auth_error("Access denied", :forbidden)
    end

    def require_api_user
      return if logged_in?

      render json: { errors: ["Login required"] }, status: :unauthorized
    end

    def require_api_permission(permission)
      return if current_user.public_send("can_#{permission}?")

      render json: { errors: ["Access denied"] }, status: :forbidden
    end

    def current_user_payload
      {
        guest: !logged_in?,
        login: logged_in? ? current_user.login : nil,
        email: logged_in? ? current_user.email : nil,
        role: current_role,
        initial_admin: current_user.initial_admin?,
        can_configure_slaves: current_user.can_configure_slaves?,
        can_configure_system_variables: current_user.can_configure_system_variables?,
        can_create_accounts: current_user.can_create_accounts?,
        can_create_projects: current_user.can_create_projects?,
        can_edit_projects: current_user.can_edit_projects?,
        can_create_plans: current_user.can_create_plans?,
        can_edit_plans: current_user.can_edit_plans?,
        can_destroy_plans: current_user.can_destroy_plans?
      }
    end

    def current_role
      return "initial_admin" if current_user.initial_admin?
      return "guest" unless logged_in?

      current_user.role.presence || "user"
    end

    def full_user_json(user)
      user_json(user).merge(
        initial_admin: user.initial_admin?,
        can_assign_roles: user.can_assign_roles?,
        can_create_accounts: user.can_create_accounts?
      )
    end

    def json_request?
      request.format.json? || request.path.start_with?("/api/")
    end

    def render_json_auth_error(message, status)
      render json: { error: message }, status: status
      false
    end

    def user_json(user)
      {
        login: user.login,
        email: user.email,
        role: user.role.presence || "user"
      }
    end

    def render_not_found
      render json: { errors: ["Not found"] }, status: :not_found
    end

    def render_record_errors(record)
      render json: { errors: record.errors.full_messages }, status: :unprocessable_entity
    end
  end
end
