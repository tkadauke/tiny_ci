module TinyCI
  module Scheduler
    class MessageQueue
      class Message
        attr_accessor :command, :build
        
        def initialize(command, build)
          @command, @build = command, build
        end
      end
      
      def push(command, build)
        messages << Message.new(command, build)
      end
      
      def pop
        messages.shift
      end
      
      def empty?
        messages.empty?
      end
    
    private
      def messages
        @messages ||= []
      end
    end
  end
end
