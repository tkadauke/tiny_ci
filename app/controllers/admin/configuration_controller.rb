class Admin::ConfigurationController < ApplicationController
  before_filter :can_configure_system_variables!
  
  def index
    @config = TinyCI::Config.instance
  end
  
  def update
    @config = TinyCI::Config.instance
    @config.update_attributes(params[:config])
    flash[:notice] = 'Successfully updated configuration'
    redirect_to :action => 'index'
  end
end
