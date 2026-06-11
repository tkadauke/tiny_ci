module ApplicationCable
  class Connection < ActionCable::Connection::Base
    identified_by :current_user

    def connect
      self.current_user = find_verified_user
    end

    private

    def find_verified_user
      session_key = Rails.application.config.session_options[:key]
      user_id = cookies.encrypted[session_key]&.dig("user_id")
      User.find_by(id: user_id)
    end
  end
end
