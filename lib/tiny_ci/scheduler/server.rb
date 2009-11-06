module TinyCI
  module Scheduler
    class Server
      include Singleton
    
      def stop(build_id)
        build = Build.find(build_id)
        Runner.instance.queue.push(:stop, build)
      end
    end
  end
end
