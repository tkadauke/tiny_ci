class Admin::SetupController < ApplicationController
  layout "plain"
  skip_before_action :setup_redirect
  prepend_before_action :only_setup, except: :redirect_me

  def index
    @config = TinyCI::Setup::InitialConfig.new
    respond_to do |format|
      format.html
      format.json do
        render json: {
          step: session[:language].blank? ? "choose_language" : "config",
          defaults: setup_defaults,
          language: session[:language]
        }
      end
    end
  end

  def create
    @config = TinyCI::Setup::InitialConfig.new(params[:config].to_unsafe_h.merge(language: session[:language]))
    if @config.save
      respond_to do |format|
        format.html { redirect_to action: :restart }
        format.json { render json: { ok: true } }
      end
    else
      respond_to do |format|
        format.html do
          flash[:error] = t("flash.error.connect_to_database")
          render :index, status: :unprocessable_entity
        end
        format.json { render json: { error: @config.error_message }, status: :unprocessable_entity }
      end
    end
  end

  def restart
    Thread.start do
      sleep 2
      Process.kill("TERM", $PID)
    end
    respond_to do |format|
      format.html
      format.json { render json: { restarting: true } }
    end
  end

  def redirect_me
    respond_to do |format|
      format.js { render js: "document.location.href='/'" }
      format.json { render json: { ready: true } }
    end
  end

  protected

  def set_language
    unless action_name == "index"
      I18n.locale = session[:language] if session[:language].present?
      return
    end

    if params[:language]
      session[:language] = params[:language].to_sym
      respond_to do |format|
        format.html { redirect_to action: :index }
        format.json do
          render json: {
            step: "config",
            defaults: setup_defaults,
            language: session[:language]
          }
        end
      end
    elsif session[:language].blank?
      respond_to do |format|
        format.html { render :choose_language }
        format.json do
          render json: {
            step: "choose_language",
            defaults: setup_defaults,
            language: nil
          }
        end
      end
    else
      I18n.locale = session[:language]
    end
  end

  def only_setup
    redirect_to "/" unless setup?
  end

  def setup_defaults
    {
      db_user: "root",
      db_host: "localhost",
      db_name: "tiny_ci_production"
    }
  end
end
