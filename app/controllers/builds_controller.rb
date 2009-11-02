class BuildsController < ApplicationController
  before_filter :find_project
  
  def index
    list
    render :action => 'list'
  end
  
  def list
    @builds = @project.builds.find :all, :include => { :children => :project }, :order => 'created_at DESC'
  end
  
  def show
    @report = ['raw', 'details', 'gist'].find { |type| params[:report].to_s == type } || 'raw'
    @build = @project.builds.find_by_position!(params[:id])
    if request.xhr?
      render :partial => 'report'
    end
  end
  
  def create
    @build = @project.build!(params.except(:controller, :action, :project_id))
    flash[:notice] = "Building project #{@project.name}"
    redirect_to project_build_path(@project, @build)
  end
  
  def stop
    @build = @project.builds.find_by_position!(params[:id])
    @build.stop!
    redirect_to project_builds_path(@project)
  end

protected
  def find_project
    @project = Project.find_by_name!(params[:project_id])
  end
end
