class Admin::ConfigurationsController < ApplicationController
  before_filter :can_configure_system_variables!
  
  def show
    @config = TinyCI::Config.instance
  end
  
  def create
    @config = TinyCI::Config.instance
    @config.update_attributes(params[:config])
    flash[:notice] = 'Successfully updated configuration'
    redirect_to admin_configuration_path
  end
end
