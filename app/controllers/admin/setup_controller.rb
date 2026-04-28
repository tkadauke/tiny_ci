class Admin::SetupController < ApplicationController
  layout "plain"
  skip_before_action :setup_redirect
  before_action :only_setup, except: :redirect_me

  def index
    @config = TinyCI::Setup::InitialConfig.new
  end

  def create
    @config = TinyCI::Setup::InitialConfig.new(params[:config].to_unsafe_h.merge(language: session[:language]))
    if @config.save
      redirect_to action: :restart
    else
      flash[:error] = t("flash.error.connect_to_database")
      render :index, status: :unprocessable_entity
    end
  end

  def restart
    Thread.start do
      sleep 2
      Process.kill("TERM", $PID)
    end
  end

  def redirect_me
    render js: "document.location.href='/'"
  end

  protected

  def set_language
    if params[:language]
      session[:language] = params[:language].to_sym
      redirect_to action: :index
    elsif session[:language].blank?
      render :choose_language
    else
      I18n.locale = session[:language]
    end
  end

  def only_setup
    redirect_to "/" unless setup?
  end
end
