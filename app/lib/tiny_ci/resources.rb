module TinyCI
  # Resource matching for the scheduler. A worker's `capabilities` and a
  # plan's `requirements` are comma-separated strings such as
  # "linux, 2 gb ram, 4 cpus". Only the numbered entries ("2 gb ram") feed
  # into resource arithmetic; bare tokens ("linux") are matched separately
  # by Worker#unnumbered_resources.
  module Resources
    def self.parse(string)
      Parser.parse(string)
    end

    module Parser
      NUMBERED = /\A(\d+)\s+(.+)\z/

      def self.parse(string)
        amounts = (string || "").split(",").each_with_object({}) do |part, hash|
          token = part.strip.downcase
          next if token.empty?
          if (m = token.match(NUMBERED))
            hash[m[2]] = m[1].to_i
          end
        end
        List.new(amounts)
      end
    end

    class List
      include Enumerable

      def initialize(amounts = {})
        @amounts = amounts
      end

      def each(&block)
        @amounts.each(&block)
      end

      def [](key)
        @amounts[key]
      end

      def []=(key, value)
        @amounts[key] = value
      end

      def empty?
        @amounts.empty?
      end

      def -(other)
        diff = @amounts.dup
        diff.each_key { |key| diff[key] -= other[key].to_i if diff[key] }
        List.new(diff)
      end

      # `self` covers `other` when no numbered resource ends up over-subscribed
      # after subtraction. An empty self covers any other (no numbered
      # constraints to violate); unnumbered token matching lives elsewhere.
      def includes?(other)
        rest = self - other
        rest.empty? || rest.all? { |_, value| value.nil? || value >= 0 }
      end

      def ==(other)
        other.is_a?(List) && to_a == other.to_a
      end
    end
  end
end
