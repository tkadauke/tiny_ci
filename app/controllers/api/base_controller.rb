module Api
  class BaseController < ApplicationController
    skip_forgery_protection

    rescue_from ActiveRecord::RecordNotFound, with: :render_not_found

    private

    def require_api_user
      return if logged_in?

      render json: { errors: ["Login required"] }, status: :unauthorized
    end

    def require_api_permission(permission)
      return if current_user.public_send("can_#{permission}?")

      render json: { errors: ["Access denied"] }, status: :forbidden
    end

    def render_not_found
      render json: { errors: ["Not found"] }, status: :not_found
    end
  end
end
