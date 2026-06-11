class Api::Admin::WorkersController < Api::BaseController
  before_action :require_user
  before_action :can_configure_workers!

  def index
    render json: Worker.all.map { |worker| serialize_worker(worker) }
  end

  def show
    render json: serialize_worker(worker)
  end

  def create
    worker = Worker.new(worker_params)
    if worker.save
      render json: serialize_worker(worker), status: :created
    else
      render_record_errors(worker)
    end
  end

  def update
    if worker.update(worker_params)
      render json: serialize_worker(worker)
    else
      render_record_errors(worker)
    end
  end

  def destroy
    worker.destroy
    render json: { ok: true }
  end

  private

  def worker
    @worker ||= Worker.from_param!(params[:name])
  end

  def serialize_worker(worker)
    {
      name: worker.name,
      hostname: worker.hostname,
      protocol: worker.protocol,
      offline: worker.offline,
      busy: worker.busy?,
      capabilities: worker.capabilities,
      max_builds: worker.max_builds,
      username: worker.username,
      password: worker.password,
      base_path: worker.base_path(true),
      default_base_path: worker.default_base_path,
      environment_variables: worker.environment_variables
    }
  end

  def worker_params
    params.require(:worker).permit(
      :protocol, :name, :hostname, :username, :password,
      :base_path, :offline, :capabilities, :max_builds,
      environment_variables: {}
    )
  end
end
