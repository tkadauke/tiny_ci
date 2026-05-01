class UsersController < ApplicationController
  before_action :require_user, only: %i[index edit update]

  def index
    @users = User.all
  end

  def show
    @user = User.from_param!(params[:id])
  end

  def new
    @user = User.new
  end

  def edit
    @user = User.from_param!(params[:id])
    can_edit_account!(@user)
  end

  def create
    @user = User.new(user_params)
    @user.role = "admin" if current_user.initial_admin?
    if @user.save
      flash[:notice] = t("flash.notice.created_account")
      if logged_in?
        redirect_to users_path
      else
        session[:user_id] = @user.id
        redirect_to root_path
      end
    else
      render :new, status: :unprocessable_entity
    end
  end

  def update
    @user = User.from_param!(params[:id])
    can_edit_account!(@user) do
      attrs = user_params
      attrs = attrs.merge(role: params.dig(:user, :role)) if can_assign_roles?
      if @user.update(attrs)
        flash[:notice] = t("flash.notice.updated_profile", user: @user.login)
        redirect_to user_path(@user)
      else
        render :edit, status: :unprocessable_entity
      end
    end
  end

  private

  def user_params
    params.require(:user).permit(:login, :email, :password, :password_confirmation)
  end
end
