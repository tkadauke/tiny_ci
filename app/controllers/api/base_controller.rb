module Api
  class BaseController < ApplicationController
    skip_before_action :setup_redirect

    private

    def current_user_payload
      {
        guest: !logged_in?,
        login: logged_in? ? current_user.login : nil,
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
  end
end
