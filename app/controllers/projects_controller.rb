class ProjectsController < ApplicationController
  def index
    @projects = Project.all
  end
  
  def new
    @project = Project.new
  end
  
  def edit
    @project = Project.find_by_name!(params[:id])
  end
  
  def create
    @project = Project.new(params[:project])
    if @project.save
      flash[:notice] = "Successfully created project"
      redirect_to projects_path
    else
      render :action => 'new'
    end
  end
  
  def update
    @project = Project.find_by_name!(params[:id])
    if @project.update_attributes(params[:project])
      flash[:notice] = "Successfully updated project"
      redirect_to projects_path
    else
      render :action => 'edit'
    end
  end
end
