require "json"
require "net/http"
require "uri"

module TinyCI
  module TelegramBot
    class Notifier
      TELEGRAM_API = "https://api.telegram.org".freeze

      class << self
        def notify(build)
          return unless TelegramBot.configured?
          project = build.project
          return if project&.telegram_chat_id.blank?
          return unless should_notify?(build)

          send_message(
            chat_id:           project.telegram_chat_id,
            message_thread_id: project.telegram_thread_id,
            text:              compose(build)
          )
        rescue StandardError => e
          Rails.logger.error("[telegram_bot] notify failed for build=#{build.id}: #{e.class}: #{e.message}")
        end

        private

        # Notify on bad outcomes and on "back to green" (success after
        # a bad build). Successful builds on already-green plans are
        # silent so the bot doesn't spam.
        def should_notify?(build)
          return true if build.bad?
          return false unless build.good?

          previous = build.plan.builds
            .where("finished_at IS NOT NULL AND id != ?", build.id)
            .order(created_at: :desc)
            .first
          previous&.bad? || previous.nil? # notify on very first success too
        end

        def compose(build)
          icon = build.good? ? "✅" : "❌"
          project_slug = build.project.name
          plan_name    = build.plan.name
          duration_str = build.duration ? " — #{humanize(build.duration.round)}" : ""
          url          = build_url(build)

          line = "#{icon} *#{escape(project_slug)}/#{escape(plan_name)}* #{escape(build.status)}#{duration_str}"
          url ? "#{line}\n[View build →](#{url})" : line
        end

        def build_url(build)
          base = ENV["TINY_CI_PUBLIC_URL"].presence
          return unless base
          "#{base.chomp("/")}/projects/#{build.project.to_param}/plans/#{build.plan.to_param}/builds/#{build.to_param}"
        end

        def humanize(seconds)
          parts = []
          parts << "#{seconds / 3600}h" if seconds >= 3600
          parts << "#{(seconds % 3600) / 60}m" if seconds >= 60
          parts << "#{seconds % 60}s"
          parts.join(" ")
        end

        # Telegram MarkdownV2 requires escaping these characters outside
        # code spans. Keep it simple: escape the minimal set that appears
        # in project/plan names.
        def escape(text)
          text.to_s.gsub(/([_*\[\]()~`>#+\-=|{}.!\\])/, '\\\\\1')
        end

        def send_message(chat_id:, message_thread_id:, text:)
          uri  = URI("#{TELEGRAM_API}/bot#{TelegramBot.token}/sendMessage")
          body = { chat_id: chat_id, text: text, parse_mode: "MarkdownV2", disable_web_page_preview: true }
          body[:message_thread_id] = message_thread_id if message_thread_id.present?

          Net::HTTP.post(uri, JSON.generate(body), "Content-Type" => "application/json")
        end
      end
    end
  end
end
