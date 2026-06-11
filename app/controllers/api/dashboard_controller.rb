class Api::DashboardController < ApplicationController
  before_action :require_user

  def show
    render json: TinyCI::Api::DashboardPayload.new.as_json
  end
end
