class ProjectsController < ApplicationController
  def index
    list
    render :action => 'list'
  end
  
  def list
    @projects = Project.root_set
  end
  
  def show
    @project = Project.find_by_name!(params[:id])
  end
  
  def new
    if params[:clone]
      @project = Project.find_for_cloning!(params[:clone])
    elsif params[:parent]
      @project = Project.new_with_parent(params[:parent])
    else
      @project = Project.new
    end
  end
  
  def edit
    @project = Project.find_by_name!(params[:id])
  end
  
  def create
    @project = Project.new(params[:project])
    if @project.save
      flash[:notice] = "Successfully created project"
      redirect_to project_path(@project)
    else
      render :action => 'new'
    end
  end
  
  def update
    @project = Project.find_by_name(params[:id])
    if @project.update_attributes(params[:project])
      flash[:notice] = "Successfully updated project"
      redirect_to project_path(@project)
    else
      render :action => 'edit'
    end
  end
end
