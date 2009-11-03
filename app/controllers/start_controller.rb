class StartController < ApplicationController
  def index
    @slaves = Slave.all
    @recent_builds = Build.finished.find(:all, :order => 'created_at desc', :limit => 5)
    render :partial => "queue" if request.xhr?
  end
end
