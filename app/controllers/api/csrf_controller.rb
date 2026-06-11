class Api::CsrfController < Api::BaseController
  def token
    render json: { token: form_authenticity_token }
  end
end
