module TinyCI
  # Outbound Telegram notifications via a dedicated tiny_ci_bot identity.
  # Distinct from Winston/Gloria so CI messages have their own voice and
  # token, and so the bot can be installed in project-specific groups.
  #
  # Configured per-project via projects.telegram_chat_id (required) and
  # projects.telegram_thread_id (optional; for supergroup topics). The
  # bot token lives in TINY_CI_BOT_TELEGRAM_TOKEN.
  #
  # Notification rules (slice 1):
  #   bad build              → always notify
  #   success after failure  → notify ("back to green")
  #   success after success  → silent
  module TelegramBot
    def self.configured?
      token.present?
    end

    def self.token
      ENV["TINY_CI_BOT_TELEGRAM_TOKEN"].presence
    end
  end
end
