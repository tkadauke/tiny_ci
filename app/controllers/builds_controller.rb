class BuildsController < ApplicationController
  before_action :require_user
  before_action :find_project
  before_action :find_plan

  def index
    @builds = @plan.builds.includes(children: :plan).order("created_at DESC")
    render partial: "list", locals: { builds: @builds } if request.xhr?
  end

  def show
    @report = %w[raw details gist].find { |type| params[:report].to_s == type } || "raw"
    @build = @plan.builds.find_by!(position: params[:id])
    render partial: "build" if request.xhr?
  end

  def create
    @build = @plan.build!(starter: current_user.to_user, parameters: build_parameters)
    flash[:notice] = t("flash.notice.building_plan", name: @plan.name)
    redirect_to project_plan_build_path(@project, @plan, @build)
  end

  def stop
    @build = @plan.builds.from_param!(params[:id])
    @build.stop!
    if request.xhr?
      head :ok
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

  def build_parameters
    params.to_unsafe_h.except("controller", "action", "plan_id", "project_id", "authenticity_token")
  end
end
