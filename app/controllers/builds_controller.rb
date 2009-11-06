class BuildsController < ApplicationController
  before_filter :find_plan
  
  def index
    @builds = @plan.builds.find :all, :include => { :children => :plan }, :order => 'created_at DESC'
    
    render :partial => 'list', :locals => { :builds => @builds } if request.xhr?
  end
  
  def show
    @report = ['raw', 'details', 'gist'].find { |type| params[:report].to_s == type } || 'raw'
    @build = @plan.builds.find_by_position!(params[:id])
    if request.xhr?
      render :partial => 'report'
    end
  end
  
  def create
    @build = @plan.build!(params.except(:controller, :action, :plan_id))
    flash[:notice] = "Building plan #{@plan.name}"
    redirect_to plan_build_path(@plan, @build)
  end
  
  def stop
    @build = @plan.builds.find_by_position!(params[:id])
    @build.stop!
    redirect_to plan_builds_path(@plan)
  end

protected
  def find_plan
    @plan = Plan.find_by_name!(params[:plan_id])
  end
end
