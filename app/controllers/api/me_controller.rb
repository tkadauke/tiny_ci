module Api
  class MeController < BaseController
    def show
      render json: current_user_payload
    end
  end
end
