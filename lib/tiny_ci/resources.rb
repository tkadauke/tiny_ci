module TinyCI
  class Resources
    class Parser
      def self.parse(string)
        new(string).parse!
      end
      
      def initialize(string)
        @parts = (string || "").split(',').map(&:strip).map(&:downcase)
      end
      
      def parse!
        amounts = @parts.inject({}) do |hash, cap|
          num = cap[/^(\d+)/, 1]
          name = cap[/^(\d+)\s+(.*)$/, 2] || cap
          hash[name] = (num ? num.to_i : nil)
          hash
        end
        
        @resources = Resources.new(amounts)
      end
    end
    
    include Enumerable
    
    delegate :each, :[], :[]=, :to => '@resources'
    
    def initialize(resources)
      @resources = resources
    end
    
    def -(other)
      result = @resources.dup
      result.each do |key, value|
        result[key] -= other[key].to_i if result[key]
      end
      
      Resources.new(result)
    end
    
    def includes?(other)
      rest = self - other
      rest.blank? || rest.all? { |key, value| value && value >= 0 || !value }
    end
  end
end
