module SimpleCI
  module Scheduler
    class Client
      def self.stop(build)
        server.stop(build)
      end
      
    private
      def self.server
        require 'drb'
        
        @server ||= begin
          DRb.start_service
          DRbObject.new(nil, "druby://localhost:2250")
        end
      end
    end
  end
end
