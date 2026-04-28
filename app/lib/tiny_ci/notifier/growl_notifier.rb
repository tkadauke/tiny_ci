module TinyCI
  module Notifier
    # Growl is a dead notification framework on modern macOS. The notifier is
    # kept so existing user configs don't blow up; it loads ruby-growl
    # lazily and short-circuits if the gem isn't installed or no host is set.
    class GrowlNotifier < Base
      def success(build)
        return unless growl_available?

        connection.notify(
          "TinyCI Notification",
          I18n.t("growl_notifier.subject.success"),
          I18n.t("growl_notifier.text.success",
                 project: build.project.name,
                 plan: build.name,
                 build: build.position)
        )
      rescue SocketError
        raise "Could not connect to Growl on #{host}"
      end

      def failure(build)
        return unless growl_available?

        connection.notify(
          "TinyCI Notification",
          I18n.t("growl_notifier.subject.failure"),
          I18n.t("growl_notifier.text.failure",
                 project: build.project.name,
                 plan: build.name,
                 build: build.position,
                 status: build.status)
        )
      rescue SocketError
        raise "Could not connect to Growl on #{host}"
      end

      protected

      def growl_available?
        @growl_available ||= load_growl && !host.nil?
      end

      def connection
        @connection ||= Growl.new(host, "TinyCI", ["TinyCI Notification"])
      end

      def load_growl
        require "ruby-growl"
        true
      rescue LoadError
        false
      end

      def host
        @recipient.config.growl_host
      end
    end
  end
end
