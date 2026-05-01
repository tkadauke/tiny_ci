class ApplicationController < ActionController::Base
  protect_from_forgery with: :exception

  before_action :setup_redirect
  before_action :set_language unless Rails.env.test?

  helper_method :setup?, :current_user, :logged_in?

  protected

  def set_language
    return unless defined?(TinyCI::Config)
    I18n.locale = TinyCI::Config.language.to_sym
  rescue StandardError
    # Config might not be available in this stripped-down boot
    I18n.locale = I18n.default_locale
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
        flash[:error] = t("flash.error.access_denied")
        redirect_to root_path
      end
    else
      super
    end
  end

  def respond_to_missing?(method, include_private = false)
    method.to_s.match?(/^can_.*[!?]$/) || super
  end

  def setup_redirect
    redirect_to "/admin/setup" if setup?
  end

  def setup?
    ENV["SETUP"] == "true"
  end

  def current_user
    @current_user ||= load_current_user
  end

  def load_current_user
    user = User.find_by(id: session[:user_id]) if session[:user_id]
    user || Guest.new
  end

  def logged_in?
    current_user.is_a?(User)
  end

  def require_user
    return if logged_in?
    store_location
    flash[:notice] = t("flash.notice.login_required")
    redirect_to login_url
    false
  end

  def store_location
    session[:return_to] = request.original_fullpath
  end

  def not_found
    render template: "errors/404", status: :not_found, layout: "plain"
  end

  # Surface request_id, remote_ip, and user_id onto the controller log
  # payload so lograge can render them. Default Rails payload omits them;
  # without this hook those fields would print as nil.
  def append_info_to_payload(payload)
    super
    payload[:request_id] = request.request_id
    payload[:remote_ip]  = request.remote_ip
    payload[:user_id]    = current_user.id if logged_in?
  end
end
