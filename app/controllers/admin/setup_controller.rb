class Admin::SetupController < ApplicationController
  skip_before_filter :setup
  before_filter :only_setup, :except => :redirect_me
  
  def index
    @config = TinyCI::Setup::InitialConfig.new
  end
  
  def create
    @config = TinyCI::Setup::InitialConfig.new(params[:config])
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

protected
  def only_setup
    redirect_to '/' unless setup?
  end
end
