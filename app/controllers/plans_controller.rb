class PlansController < ApplicationController
  before_filter :find_project
  
  def index
    @report = params[:report] || 'list'
    @plans = @project.root_plans
    render :partial => @report, :locals => { :plans => @plans } if request.xhr?
  end
  
  def show
    @plan = @project.plans.find_by_name!(params[:id])
  end
  
  def new
    if params[:clone]
      @plan = Plan.find_for_cloning!(params[:clone])
    elsif params[:parent]
      @plan = Plan.new_with_parent(params[:parent])
    else
      @plan = Plan.new
    end
  end
  
  def edit
    @plan = @project.plans.find_by_name!(params[:id])
  end
  
  def child
    @plan = @project.plans.find_by_name!(params[:id])
  end
  
  def create
    @plan = @project.plans.build(params[:plan])
    if @plan.save
      flash[:notice] = "Successfully created plan"
      redirect_to project_plan_path(@project, @plan)
    else
      render :action => 'new'
    end
  end
  
  def update
    @plan = @project.plans.find_by_name!(params[:id])
    if @plan.update_attributes(params[:plan])
      flash[:notice] = "Successfully updated plan"
      redirect_to project_plan_path(@project, @plan)
    else
      render :action => 'edit'
    end
  end
  
  def destroy
    @plan = @project.plans.find_by_name!(params[:id])
    @plan.destroy
    redirect_to project_plans_path(@project)
  end

private
  def find_project
    @project = Project.find_by_name!(params[:project_id])
  end
end
