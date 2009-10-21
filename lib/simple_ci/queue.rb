require 'drb'

module SimpleCI
  class Queue
    def self.enqueue(build)
      remote_queue.enqueue(build.id)
    end
    
    def self.remote_queue
      @remote_queue ||= begin
        DRb.start_service
        DRbObject.new nil, "druby://localhost:2250"
      end
    end
  end
end
