module TinyCI
  module Notifier
    # Stub: legacy notifiers (email, growl) live under modules/ and are not
    # ported yet. Calling notify is a no-op for now.
    class Base
      def self.notify(_build) = nil
    end
  end
end
