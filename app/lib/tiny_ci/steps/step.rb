module TinyCI
  module Steps
    class Step
      include TinyCI::Util::Executor

      def initialize(build)
        @build = build
      end

      def run!
        log "Executing step #{self.class.name}"
        execute!
      end

      protected

      def log(message)
        Rails.logger.info(message)
      end
    end
  end
end
