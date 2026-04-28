module TinyCI
  # Stub for the legacy resource matcher. The real implementation lives in
  # lib/tiny_ci/resources.rb (legacy Rails 2 code) and is not yet ported. This
  # stub returns empty resource lists so the web tier can boot without the
  # scheduler being available.
  module Resources
    class List
      def initialize(items = [])
        @items = items
      end

      def includes?(_other)
        true
      end

      def -(_other)
        self
      end
    end

    module Parser
      def self.parse(_input)
        List.new
      end
    end
  end
end
