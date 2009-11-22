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
end
