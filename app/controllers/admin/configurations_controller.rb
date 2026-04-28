class Admin::ConfigurationsController < ApplicationController
  before_action :require_user
  before_action :can_configure_system_variables!

  def show
    @config = TinyCI::Config.instance
  end

  def create
    @config = TinyCI::Config.instance
    @config.update(params[:config].to_unsafe_h)
    flash[:notice] = t("flash.notice.updated_configuration")
    redirect_to admin_configuration_path
  end
end
