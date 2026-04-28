class UserSessionsController < ApplicationController
  def new
  end

  def create
    user = User.find_by(login: params.dig(:user_session, :login))
    if user&.authenticate(params.dig(:user_session, :password))
      session[:user_id] = user.id
      flash[:notice] = t("flash.notice.logged_in")
      redirect_to root_url
    else
      flash.now[:error] = t("flash.error.login_failed", default: "Invalid login or password")
      render :new, status: :unprocessable_entity
    end
  end

  def destroy
    reset_session
    flash[:notice] = t("flash.notice.logged_out")
    redirect_to root_url
  end
end
