class BuildsController < ApplicationController
  before_filter :find_project
  before_filter :find_plan
  
  def index
    @builds = @plan.builds.find :all, :include => { :children => :plan }, :order => 'created_at DESC'
    
    render :partial => 'list', :locals => { :builds => @builds } if request.xhr?
  end
  
  def show
    @report = ['raw', 'details', 'gist'].find { |type| params[:report].to_s == type } || 'raw'
    @build = @plan.builds.find_by_position!(params[:id])
    render :partial => 'report' if request.xhr?
  end
  
  def create
    @build = @plan.build!(params.except(:controller, :action, :plan_id))
    flash[:notice] = "Building plan #{@plan.name}"
    redirect_to project_plan_build_path(@project, @plan, @build)
  end
  
  def stop
    @build = @plan.builds.find_by_position!(params[:id])
    @build.stop!
    redirect_to project_plan_builds_path(@project, @plan)
  end

protected
  def find_project
    @project = Project.find_by_name!(params[:project_id])
  end
  
  def find_plan
    @plan = @project.plans.find_by_name!(params[:plan_id])
  end
end
