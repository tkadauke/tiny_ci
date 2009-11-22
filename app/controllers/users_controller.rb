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
  end
  
  def create
    @user = User.new(params[:user])
    if @user.save
      flash[:notice] = "Successfully created account"
      redirect_to users_path
    else
      render :action => 'new'
    end
  end
  
  def update
    @user = User.from_param!(params[:id])
    if @user.update_attributes(params[:user])
      flash[:notice] = "Successfully updated #{@user.login}'s profile"
      redirect_to user_path(@user)
    end
  end
end
