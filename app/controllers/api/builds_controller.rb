module Api
  class BuildsController < BaseController
    before_action :require_api_user
    before_action :find_project
    before_action :find_plan
    before_action :find_build, only: %i[show stop]

    def index
      builds = @plan.builds.includes(:starter, children: :plan).order("created_at DESC")
      render json: builds.map { |build| build_json(build) }
    end

    def show
      render json: build_json(@build).merge(output: @build.output)
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

    def build_json(build)
      {
        position: build.position,
        status: build.status,
        created_at: build.created_at,
        started_at: build.started_at,
        finished_at: build.finished_at,
        starter: user_json(build.starter),
        children: build.children.map { |child| build_child_json(child) }
      }
    end

    def build_child_json(build)
      build_json(build).merge(plan: plan_json(build.plan))
    end

    def plan_json(plan)
      {
        id: plan.id,
        name: plan.name,
        project: {
          id: plan.project.id,
          name: plan.project.name
        }
      }
    end

    def user_json(user)
      return nil unless user

      {
        id: user.id,
        login: user.login
      }
    end
  end
end
