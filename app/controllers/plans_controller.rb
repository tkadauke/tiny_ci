class PlansController < ApplicationController
  before_action :find_project, except: :full_index
  before_action :can_create_plans!,  only: %i[new create]
  before_action :can_edit_plans!,    only: %i[edit update]
  before_action :can_destroy_plans!, only: %i[destroy]

  def index
    @report = params[:report] || "list"
    @plans = @project.root_plans
    render partial: @report, locals: { plans: @plans } if request.xhr?
  end

  def full_index
    @report = params[:report] || "list"
    @plans = Plan.includes(:project).order("projects.name asc, plans.name asc")
    render partial: @report, locals: { plans: @plans } if request.xhr?
  end

  def show
    @plan = @project.plans.from_param!(params[:id])
  end

  def new
    @plan =
      if params[:clone]
        Plan.find_for_cloning!(params[:clone])
      elsif params[:parent]
        Plan.new_with_parent(params[:parent])
      else
        Plan.new
      end
  end

  def edit
    @plan = @project.plans.from_param!(params[:id])
  end

  def child
    @plan = @project.plans.from_param!(params[:id])
  end

  def create
    @plan = @project.plans.build(plan_params)
    if @plan.save
      flash[:notice] = t("flash.notice.created_plan")
      redirect_to project_plan_path(@project, @plan)
    else
      render :new, status: :unprocessable_entity
    end
  end

  def update
    @plan = @project.plans.from_param!(params[:id])
    if @plan.update(plan_params)
      flash[:notice] = t("flash.notice.updated_plan")
      redirect_to project_plan_path(@project, @plan)
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @plan = @project.plans.from_param!(params[:id])
    @plan.destroy
    redirect_to project_plans_path(@project)
  end

  private

  def find_project
    @project = Project.from_param!(params[:project_id])
  end

  def plan_params
    params.require(:plan).permit(
      :name, :description, :steps, :repository_url, :requirements,
      :parent_id, :previous_plan_id
    )
  end
end
