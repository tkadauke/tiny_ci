require 'drb'

module SimpleCI
  class QueueRunner
    def self.run
      @queue = []
      
      # start up the DRb service
      DRb.start_service "druby://localhost:2250", self
      
      loop do
        sleep 1
        next if @queue.empty?
        
        project = ::Project.find(@queue.first)
        if project.buildable?
          project.build!
          @queue.shift
        end
      end

      # wait for the DRb service to finish before exiting
      DRb.thread.join
    end
    
    def self.enqueue(project)
      @queue << project
    end
  end
end
