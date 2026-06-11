class Api::BuildsController < ApplicationController
  before_action :require_user
  before_action :find_project
  before_action :find_plan

  def index
    builds = @plan.builds.includes(:starter, plan: :project, children: [:starter, { plan: :project }]).order(created_at: :desc)
    render json: builds.map { |build| TinyCI::Api::BuildSerializer.new(build).as_json }
  end

  def show
    render json: TinyCI::Api::BuildSerializer.new(find_build, include_output: true).as_json
  end

  def stop
    find_build.stop!
    render json: { ok: true }
  end

  private

  def find_project
    @project = Project.from_param!(params[:project_id])
  end

  def find_plan
    @plan = @project.plans.from_param!(params[:plan_id])
  end

  def find_build
    @build ||= @plan.builds.from_param!(params[:id])
  end
end
