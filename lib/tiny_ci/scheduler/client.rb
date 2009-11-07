module TinyCI
  module Scheduler
    class Client
      class << self
        def stop(build)
          server.stop(build.id)
        end
      
      private
        def server
          require 'drb'
        
          @server ||= connect_to_server
        end
      
        def connect_to_server
          DRb.start_service
          DRbObject.new(nil, "druby://localhost:2250")
        end
      end
    end
  end
end
