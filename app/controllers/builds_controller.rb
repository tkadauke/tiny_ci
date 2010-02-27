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
    render :partial => 'build' if request.xhr?
  end
  
  def create
    @build = @plan.build!(:starter => current_user.to_user, :parameters => params.except(:controller, :action, :plan_id))
    flash[:notice] = t('flash.notice.building_plan', :name => @plan.name)
    redirect_to project_plan_build_path(@project, @plan, @build)
  end
  
  def stop
    @build = @plan.builds.from_param!(params[:id])
    @build.stop!
    if request.xhr?
      render :nothing => true
    else
      redirect_to project_plan_builds_path(@project, @plan)
    end
  end

protected
  def find_project
    @project = Project.from_param!(params[:project_id])
  end
  
  def find_plan
    @plan = @project.plans.from_param!(params[:plan_id])
  end
end
