module Api
  class BuildsController < BaseController
    before_action :require_api_user
    before_action :find_project
    before_action :find_plan
    before_action :find_build, only: %i[show stop]

    def index
      builds = @plan.builds.includes(:starter, plan: :project, children: [:starter, { plan: :project }]).order(created_at: :desc)
      render json: builds.map { |build| TinyCI::Api::BuildSerializer.new(build).as_json }
    end

    def show
      render json: TinyCI::Api::BuildSerializer.new(@build, include_output: true).as_json
    end

    def stop
      @build.stop!
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
      @build = @plan.builds.from_param!(params[:id])
    end
  end
end
