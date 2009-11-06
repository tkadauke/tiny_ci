class PlansController < ApplicationController
  def index
    @report = params[:report] || 'list'
    @plans = Plan.root_set
    render :partial => @report, :locals => { :plans => @plans } if request.xhr?
  end
  
  def show
    @plan = Plan.find_by_name!(params[:id])
  end
  
  def new
    if params[:clone]
      @plan = Plan.find_for_cloning!(params[:clone])
    elsif params[:parent]
      @plan = Plan.new_with_parent(params[:parent])
    else
      @plan = Plan.new
    end
  end
  
  def edit
    @plan = Plan.find_by_name!(params[:id])
  end
  
  def create
    @plan = Plan.new(params[:plan])
    if @plan.save
      flash[:notice] = "Successfully created plan"
      redirect_to plan_path(@plan)
    else
      render :action => 'new'
    end
  end
  
  def update
    @plan = Plan.find_by_name(params[:id])
    if @plan.update_attributes(params[:plan])
      flash[:notice] = "Successfully updated plan"
      redirect_to plan_path(@plan)
    else
      render :action => 'edit'
    end
  end
end
