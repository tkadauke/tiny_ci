module TinyCI
  module Scheduler
    # Stub: legacy DRb-based scheduler client. To be replaced with Solid Queue.
    class Client
      def self.stop(_build) = nil
    end
  end
end
