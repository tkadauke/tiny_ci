class Api::BaseController < ApplicationController
  private

  def render_record_errors(record)
    render json: { errors: record.errors.full_messages }, status: :unprocessable_entity
  end
end
