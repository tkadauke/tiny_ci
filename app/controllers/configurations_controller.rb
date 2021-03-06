class ConfigurationsController < ApplicationController
  before_filter :require_user
  
  def show
    @config = current_user.config
  end
  
  def create
    current_user.config.update_attributes(params[:config])
    flash[:notice] = t('flash.notice.updated_configuration')
    redirect_to settings_path
  end
end
