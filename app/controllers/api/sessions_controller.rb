module Api
  class SessionsController < BaseController
    def destroy
      reset_session
      render json: { flash: { type: "notice", message: t("flash.notice.logged_out") } }
    end
  end
end
