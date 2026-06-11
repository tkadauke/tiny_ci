module Api
  class ProjectsController < BaseController
    before_action -> { require_api_permission(:create_projects) }, only: :create
    before_action -> { require_api_permission(:edit_projects) }, only: :update
    before_action -> { require_api_permission(:destroy_projects) }, only: :destroy
    before_action :find_project, only: %i[update destroy]

    def index
      render json: Project.all.map { |project| project_json(project) }
    end

    def create
      project = Project.new(project_params)

      if project.save
        render json: project_json(project), status: :created
      else
        render json: { errors: project.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def update
      if @project.update(project_params)
        render json: project_json(@project)
      else
        render json: { errors: @project.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def destroy
      @project.destroy
      render json: { ok: true }
    end

    private

    def find_project
      @project = Project.from_param!(params[:project_id])
    end

    def project_params
      params.require(:project).permit(:name, :description)
    end

    def project_json(project)
      {
        id: project.id,
        name: project.name,
        description: project.description
      }
    end
  end
end
