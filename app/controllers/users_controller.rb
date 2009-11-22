class UsersController < ApplicationController
  def show
    @user = User.from_param!(params[:id])
  end
  
  def edit
    @user = User.from_param!(params[:id])
  end
  
  def update
    @user = User.from_param!(params[:id])
    if @user.update_attributes(params[:user])
      flash[:notice] = "Successfully updated #{@user.login}'s profile"
      redirect_to user_path(@user)
    end
  end
end
