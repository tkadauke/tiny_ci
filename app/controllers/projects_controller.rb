class ProjectsController < ApplicationController
  before_filter :can_create_projects!, :only => [ :new, :create ]
  before_filter :can_edit_projects!, :only => [ :edit, :update ]
  
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
    @project = Project.new(params[:project])
    if @project.save
      flash[:notice] = t('flash.notice.created_project')
      redirect_to projects_path
    else
      render :action => 'new'
    end
  end
  
  def update
    @project = Project.from_param!(params[:id])
    if @project.update_attributes(params[:project])
      flash[:notice] = t('flash.notice.updated_project')
      redirect_to projects_path
    else
      render :action => 'edit'
    end
  end
end
