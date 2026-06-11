class Api::Admin::SlavesController < Api::BaseController
  before_action :require_user
  before_action :can_configure_slaves!

  def index
    render json: Slave.all.map { |slave| serialize_slave(slave) }
  end

  def show
    render json: serialize_slave(slave)
  end

  def create
    slave = Slave.new(slave_params)
    if slave.save
      render json: serialize_slave(slave), status: :created
    else
      render_record_errors(slave)
    end
  end

  def update
    if slave.update(slave_params)
      render json: serialize_slave(slave)
    else
      render_record_errors(slave)
    end
  end

  def destroy
    slave.destroy
    render json: { ok: true }
  end

  private

  def slave
    @slave ||= Slave.from_param!(params[:name])
  end

  def serialize_slave(slave)
    {
      name: slave.name,
      hostname: slave.hostname,
      protocol: slave.protocol,
      offline: slave.offline,
      busy: slave.busy?,
      capabilities: slave.capabilities,
      max_builds: slave.max_builds,
      username: slave.username,
      base_path: slave.base_path,
      environment_variables: slave.environment_variables
    }
  end

  def slave_params
    params.require(:slave).permit(
      :protocol, :name, :hostname, :username, :password,
      :base_path, :offline, :capabilities, :max_builds,
      environment_variables: {}
    )
  end
end
