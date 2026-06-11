class BuildChannel < ApplicationCable::Channel
  def subscribed
    stream_from "build_#{params['build_name']}_#{params['build_position']}"
  end
end
