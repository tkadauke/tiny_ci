module TinyCI
  module Report
    class DeployCommandReport < Base
      class Line
        attr_accessor :channel, :string
        
        def initialize(channel, string)
          @channel, @string = channel, string
        end
      end
      
      class Output
        def lines
          @lines ||= []
        end
        
        def add_line(channel, string)
          lines << Line.new(channel, string)
        end
      end

      attr_accessor :command
      
      def output
        @output ||= Hash.new { |hash, key| hash[key] = Output.new }
      end
      
      def servers
        output.keys.sort
      end
    end
  end
end
