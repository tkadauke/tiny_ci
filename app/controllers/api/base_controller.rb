class Api::BaseController < ApplicationController
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

  def json_request?
    request.format.json? || request.path.start_with?("/api/")
  end

  def render_json_auth_error(message, status)
    render json: { error: message }, status: status
    false
  end
end
