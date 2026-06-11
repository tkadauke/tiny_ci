class QueueChannel < ApplicationCable::Channel
  def subscribed
    stream_from "queue"
    ActionCable.server.broadcast("queue", TinyCI::Api::DashboardPayload.new.as_json)
  end
end
