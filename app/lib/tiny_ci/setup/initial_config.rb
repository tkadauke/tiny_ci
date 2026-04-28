module TinyCI
  module Setup
    # Stub: original implementation rendered ERB templates in config/templates/
    # to seed an initial deployment. Not ported yet.
    class InitialConfig
      def initialize(attrs = {})
        @attrs = attrs
      end

      def save
        false
      end
    end
  end
end
