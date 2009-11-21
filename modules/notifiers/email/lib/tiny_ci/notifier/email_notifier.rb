module TinyCI
  module Notifier
    class EmailNotifier < Base
      def success(build)
        BuildMailer.deliver_success(build)
      end
      
      def failure(build)
        BuildMailer.deliver_failure(build)
      end
    end
  end
end
