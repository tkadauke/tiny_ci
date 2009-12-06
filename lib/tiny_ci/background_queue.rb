module TinyCI
  class BackgroundQueue
    include Singleton
    
    def initialize
      @queue = []
    end
    
    delegate :push, :pop, :to => '@queue'
    class << self
      delegate :run, :to => :instance
    end
    
    def run
      loop do
        message = pop
        BackgroundLite::DrbHandler.execute(message) if message
        sleep 0.1
      end
    end
  end
end
