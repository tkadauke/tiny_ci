module Api
  class PlansController < BaseController
    before_action :require_api_user
    before_action :find_project, except: :index
    before_action :find_plan, only: %i[show update destroy create_build]
    before_action -> { require_api_permission(:create_plans) }, only: :create
    before_action -> { require_api_permission(:edit_plans) }, only: :update
    before_action -> { require_api_permission(:destroy_plans) }, only: :destroy

    def index
      plans = Plan.joins(:project)
                  .preload(:project, :previous, :next, :parent, :children, :last_finished_build,
                           :last_successful_build, :last_failed_build)
                  .order("projects.name asc, plans.name asc")

      render json: plans.map { |plan| plan_json(plan) }
    end

    def project_index
      plans = @project.root_plans.includes(:project, :previous, :next, :parent, :children,
                                           :last_finished_build, :last_successful_build,
                                           :last_failed_build)
                           .order(:name)

      render json: plans.map { |plan| plan_json(plan) }
    end

    def show
      render json: plan_detail_json(@plan)
    end

    def create
      plan = @project.plans.build(plan_params)

      if plan.save
        render json: plan_detail_json(plan), status: :created
      else
        render json: { errors: plan.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def update
      if @plan.update(plan_params)
        render json: plan_detail_json(@plan)
      else
        render json: { errors: @plan.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def destroy
      @plan.destroy
      render json: { ok: true }
    end

    def create_build
      build = @plan.build!(starter: current_user.to_user)
      render json: { build: { position: build.position } }, status: :created
    end

    private

    def find_project
      @project = Project.from_param!(params[:project_id])
    end

    def find_plan
      @plan = @project.plans.from_param!(params[:plan_id])
    end

    def plan_params
      permitted = %i[name description repository_url requirements parent_id previous_plan_id]
      permitted << :steps if current_user.can_edit_plans?
      attributes = params.require(:plan).permit(*permitted)
      attributes[:previous_plan_id] = nil if attributes[:parent_id].present?
      attributes
    end

    def plan_json(plan)
      last_finished_build = plan.last_finished_build

      {
        id: plan.id,
        name: plan.name,
        description: plan.description,
        status: plan.status,
        weather: plan.weather,
        project: reference_json(plan.project),
        last_build_at: last_finished_build&.finished_at,
        last_success_at: plan.last_successful_build&.finished_at || plan.last_succeeded_at,
        last_failure_at: plan.last_failed_build&.finished_at || plan.last_failed_at,
        previous_plan: reference_json(plan.previous),
        next_plan: reference_json(plan.next),
        parent: reference_json(plan.parent),
        children_count: plan.children.size
      }
    end

    def plan_detail_json(plan)
      plan_json(plan).merge(
        repository_url: plan.repository_url,
        steps: plan.steps,
        requirements: plan.requirements,
        commit_hook_url: project_plan_builds_url(plan.project, plan),
        children: plan.children.map { |child| plan_json(child) },
        last_finished_build: build_reference_json(plan.last_finished_build),
        can_edit_plan: current_user.can_edit_plan?(plan),
        can_create_plans: current_user.can_create_plans?,
        can_destroy_plan: current_user.can_destroy_plan?(plan)
      )
    end

    def reference_json(record)
      return nil unless record

      {
        id: record.id,
        name: record.name
      }
    end

    def build_reference_json(build)
      return nil unless build

      {
        position: build.position,
        status: build.status
      }
    end
  end
end
