class Admin::SlavesController < ApplicationController
  def index
    list
    render :action => 'list'
  end
  
  def list
    @slaves = Slave.all
  end
  
  def show
    @slave = Slave.find(params[:id])
  end
  
  def new
    if params[:clone]
      @slave = Slave.find_for_cloning!(params[:clone])
    else
      @slave = Slave.new
    end
  end
  
  def edit
    @slave = Slave.find(params[:id])
  end
  
  def create
    @slave = Slave.new(params[:slave])
    if @slave.save
      flash[:notice] = "Successfully created slave"
      redirect_to admin_slave_path(@slave)
    else
      render :action => 'new'
    end
  end
  
  def update
    @slave = Slave.find(params[:id])
    if @slave.update_attributes(params[:slave])
      flash[:notice] = "Successfully updated slave"
      redirect_to admin_slave_path(@slave)
    else
      render :action => 'edit'
    end
  end
end
