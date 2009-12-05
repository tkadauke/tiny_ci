# Filters added to this controller apply to all controllers in the application.
# Likewise, all the methods added will be available for all controllers.

class ApplicationController < ActionController::Base
  helper :all # include all helpers, all the time
  # protect_from_forgery # See ActionController::RequestForgeryProtection for details

  # Scrub sensitive parameters from your log
  # filter_parameter_logging :password
  
  before_filter :setup
  
  helper_method :setup?
  helper_method :current_user_session, :current_user, :logged_in?
  
protected
  def method_missing(method, *args)
    if method.to_s =~ /^can_.*\?$/
      if current_user.send(method, *args)
        yield if block_given?
        true
      else
        false
      end
    elsif method.to_s =~ /^can_.*\!$/
      if current_user.send(method.to_s.gsub(/\!$/, '?'), *args)
        yield if block_given?
      else
        flash[:error] = 'You can not do that'
        redirect_to root_path
      end
    else
      super
    end
  end

  def setup
    redirect_to '/admin/setup' if setup?
  end
  
  def setup?
    ENV['SETUP'] == 'true'
  end

  def current_user_session
    return @current_user_session if defined?(@current_user_session)
    @current_user_session = UserSession.find
  end

  def current_user
    return @current_user if defined?(@current_user)
    @current_user = (current_user_session && current_user_session.user) || Guest.new
  end
  
  def logged_in?
    current_user.is_a? User
  end
  
  def require_user
    unless logged_in?
      store_location
      flash[:notice] = "You must be logged in to access this page"
      redirect_to login_url
      return false
    end
  end

  def store_location
    session[:return_to] = request.request_uri
  end
  
  def render_optional_error_file(status_code)
    status = interpret_status(status_code)
    render :template => "/errors/#{status[0,3]}.html.erb", :status => status, :layout => 'plain.html.erb'
  end
  
  def not_found
    render_optional_error_file(404)
  end
end
