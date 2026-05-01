class Admin::SlavesController < ApplicationController
  before_action :require_user
  before_action :can_configure_slaves!

  def index
    @slaves = Slave.all
  end

  def show
    @slave = Slave.from_param!(params[:id])
  end

  def new
    @slave =
      if params[:clone]
        Slave.find_for_cloning!(params[:clone])
      else
        Slave.new
      end
  end

  def edit
    @slave = Slave.from_param!(params[:id])
  end

  def create
    @slave = Slave.new(slave_params)
    if @slave.save
      flash[:notice] = t("flash.notice.created_slave")
      redirect_to admin_slave_path(@slave)
    else
      render :new, status: :unprocessable_entity
    end
  end

  def update
    @slave = Slave.from_param!(params[:id])
    if @slave.update(slave_params)
      flash[:notice] = t("flash.notice.updated_slave")
      redirect_to admin_slave_path(@slave)
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @slave = Slave.from_param!(params[:id])
    @slave.destroy
    flash[:notice] = t("flash.notice.deleted_slave")
    redirect_to admin_slaves_path
  end

  private

  def slave_params
    params.require(:slave).permit(
      :protocol, :name, :hostname, :username, :password,
      :base_path, :offline, :capabilities, :max_builds,
      environment_variables: {}
    )
  end
end
