class UsersController < ApplicationController
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
    @user = User.new(params[:user])
    @user.role = 'admin' if current_user.initial_admin?
    if @user.save
      flash[:notice] = t('flash.notice.created_account')
      redirect_to users_path
    else
      render :action => 'new'
    end
  end
  
  def update
    @user = User.from_param!(params[:id])
    can_edit_account!(@user) do
      @user.role = params[:user][:role] if can_assign_roles?
      
      if @user.update_attributes(params[:user])
        flash[:notice] = t('flash.notice.updated_profile', :user => @user.login)
        redirect_to user_path(@user)
      end
    end
  end
end
