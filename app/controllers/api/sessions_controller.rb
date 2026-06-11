class Api::SessionsController < Api::BaseController
  def create
    user = User.find_by(login: params[:login])

    if user&.authenticate(params[:password])
      session[:user_id] = user.id
      flash[:notice] = t("flash.notice.logged_in")
      render json: full_user_json(user)
    else
      render json: { error: "Invalid login or password" }, status: :unprocessable_entity
    end
  end

  def destroy
    reset_session
    flash[:notice] = t("flash.notice.logged_out")
    render json: { ok: true }
  end
end
