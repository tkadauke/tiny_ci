module TinyCI
  module Notifier
    # Notification dispatch. The legacy implementation used a `background_lite`
    # plugin to run notify in a fork; that plugin is gone. Notifications run
    # synchronously here. To re-add async dispatch, wrap notify in an
    # ActiveJob — same pattern as BuildJob.
    class Base
      class << self
        def notify(build)
          if build.good?
            recipients.each { |recipient| success(recipient, build) }
          elsif build.bad?
            recipients.each { |recipient| failure(recipient, build) }
          end
        end

        def success(recipient, build)
          notifiers.each do |klass|
            log_exceptions { klass.new(recipient).success(build) }
          end
        end

        def failure(recipient, build)
          notifiers.each do |klass|
            log_exceptions { klass.new(recipient).failure(build) }
          end
        end

        # Concrete notifiers register themselves on Base via `inherited`.
        # No autoloading magic; each subclass is plain Ruby.
        def notifiers
          @notifiers ||= []
        end

        def inherited(subclass)
          super
          (Base.instance_variable_get(:@notifiers) ||
            Base.instance_variable_set(:@notifiers, [])) << subclass
        end

        def recipients
          User.all
        end

        private

        def log_exceptions
          yield
        rescue StandardError => e
          Rails.logger.error(e.message)
          Rails.logger.error(e.backtrace.join("\n"))
        end
      end

      def initialize(recipient)
        @recipient = recipient
      end

      def success(_build)
        raise NotImplementedError
      end

      def failure(_build)
        raise NotImplementedError
      end
    end
  end
end
