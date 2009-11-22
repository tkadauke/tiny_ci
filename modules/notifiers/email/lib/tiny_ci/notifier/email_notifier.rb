module TinyCI
  module Notifier
    class EmailNotifier < Base
      def success(build)
        BuildMailer.deliver_success(@recipient, build)
      end
      
      def failure(build)
        BuildMailer.deliver_failure(@recipient, build)
      end
    end
  end
end
