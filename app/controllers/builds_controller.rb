class BuildsController < ApplicationController
  before_filter :find_project
  
  def index
    list
    render :action => 'list'
  end
  
  def list
    @builds = @project.builds
  end
  
  def show
    @build = @project.builds.find_by_position(params[:id])
  end
  
  def create
    @build = @project.build!
    flash[:notice] = "Building project #{@project.name}"
    redirect_to project_build_path(@project, @build)
  end

protected
  def find_project
    @project = Project.find_by_name(params[:project_id])
  end
end
