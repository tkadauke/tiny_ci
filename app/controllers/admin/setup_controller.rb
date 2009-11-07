class Admin::SetupController < ApplicationController
  skip_before_filter :setup
  
  def index
    @config = InitialConfig.new
  end
  
  def create
    @config = InitialConfig.new(params[:config])
    if @config.save
      redirect_to :action => 'restart'
    else
      flash[:error] = 'Could not connect to the database'
      render :action => 'index'
    end
  end
  
  def restart
    Thread.start do
      sleep 2
      Process.kill("TERM", $PID)
    end
  end
  
  def redirect_me
    render :js => "document.location.href='/'"
  end
end
