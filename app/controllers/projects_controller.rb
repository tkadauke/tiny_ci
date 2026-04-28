class ProjectsController < ApplicationController
  before_action :can_create_projects!, only: %i[new create]
  before_action :can_edit_projects!,   only: %i[edit update]

  def index
    @projects = Project.all
  end

  def new
    @project = Project.new
  end

  def edit
    @project = Project.from_param!(params[:id])
  end

  def show
    redirect_to project_plans_path(Project.from_param!(params[:id]))
  end

  def create
    @project = Project.new(project_params)
    if @project.save
      flash[:notice] = t("flash.notice.created_project")
      redirect_to projects_path
    else
      render :new, status: :unprocessable_entity
    end
  end

  def update
    @project = Project.from_param!(params[:id])
    if @project.update(project_params)
      flash[:notice] = t("flash.notice.updated_project")
      redirect_to projects_path
    else
      render :edit, status: :unprocessable_entity
    end
  end

  private

  def project_params
    params.require(:project).permit(:name, :description)
  end
end
