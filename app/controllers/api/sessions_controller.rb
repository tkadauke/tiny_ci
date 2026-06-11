module Api
  class SessionsController < BaseController
    def create
      user = User.find_by(login: params[:login])

      if user&.authenticate(params[:password])
        session[:user_id] = user.id
        render json: full_user_json(user)
      else
        render json: { error: "Invalid login or password" }, status: :unprocessable_entity
      end
    end

    def destroy
      reset_session
      render json: {
        ok: true,
        flash: { type: "notice", message: t("flash.notice.logged_out") }
      }
    end
  end
end
