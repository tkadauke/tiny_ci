module TinyCI
  module Notifier
    class EmailNotifier < Base
      def success(build)
        BuildMailer.success(@recipient, build).deliver_now
      end

      def failure(build)
        BuildMailer.failure(@recipient, build).deliver_now
      end
    end
  end
end
