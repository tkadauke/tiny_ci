class Admin::SlavesController < ApplicationController
  before_filter :can_configure_slaves!
  
  def index
    @slaves = Slave.all
  end
  
  def show
    @slave = Slave.from_param!(params[:id])
  end
  
  def new
    if params[:clone]
      @slave = Slave.find_for_cloning!(params[:clone])
    else
      @slave = Slave.new
    end
  end
  
  def edit
    @slave = Slave.from_param!(params[:id])
  end
  
  def create
    @slave = Slave.new(params[:slave])
    if @slave.save
      flash[:notice] = t('flash.notice.created_slave')
      redirect_to admin_slave_path(@slave)
    else
      render :action => 'new'
    end
  end
  
  def update
    @slave = Slave.from_param!(params[:id])
    if @slave.update_attributes(params[:slave])
      flash[:notice] = t('flash.notice.updated_slave')
      redirect_to admin_slave_path(@slave)
    else
      render :action => 'edit'
    end
  end
  
  def destroy
    @slave = Slave.from_param!(params[:id])
    @slave.destroy
    flash[:notice] = t('flash.notice.deleted_slave')
    redirect_to admin_slaves_path
  end
end
