class ConfigurationsController < ApplicationController
  before_action :require_user

  def show
    @config = current_user.config
  end

  def create
    current_user.config.update(params[:config].to_unsafe_h)
    flash[:notice] = t("flash.notice.updated_configuration")
    redirect_to settings_path
  end
end
