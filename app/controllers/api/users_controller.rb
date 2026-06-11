class Api::UsersController < Api::BaseController
  before_action :require_user, only: %i[index update]

  def index
    render json: User.all.map { |user| user_json(user) }
  end

  def create
    user = User.new(create_user_params)
    user.role = role_for_create

    if user.save
      session[:user_id] = user.id unless logged_in?
      render json: full_user_json(user), status: :created
    else
      render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def show
    render json: user_json(User.from_param!(params[:login]))
  end

  def update
    user = User.from_param!(params[:login])
    return unless can_edit_account!(user)

    if user.update(update_user_params(user))
      render json: user_json(user)
    else
      render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def user_payload
    request_payload = ActionController::Parameters.new(request.request_parameters)
    if request_payload[:user].present?
      request_payload[:user]
    else
      request_payload.presence || params[:user].presence || params
    end
  end

  def create_user_params
    user_payload.permit(:login, :email, :password, :password_confirmation)
  end

  def update_user_params(user)
    permitted = [:email]
    permitted << :role if current_user.can_assign_roles? && user != current_user
    user_payload.permit(*permitted)
  end

  def role_for_create
    if current_user.initial_admin?
      "admin"
    else
      "user"
    end
  end
end
