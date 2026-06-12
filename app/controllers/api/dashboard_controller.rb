class Api::DashboardController < ApplicationController
  def show
    render json: TinyCI::Api::DashboardPayload.new.as_json
  end
end
