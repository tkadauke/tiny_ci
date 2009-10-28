module SimpleCI
  module Scheduler
    class Server
      include Singleton
    
      def self.run
        instance.run
      end
    
      def run
        loop do
          builds = ::Build.pending.find(:all)
          next_build = builds.find { |build| build.buildable? }
          start(next_build) if next_build
          sleep 2
        end
      end
    
      def start(build)
        build.update_attributes :status => 'running'
        processes[build.id] = fork { exec "script/builder", build.id.to_s }
      end
    
      def stop(build)
        pid = processes[build.id]
        if pid
          Process.kill("TERM", pid)
        end
      end
  
    private
      def processes
        @processes ||= {}
      end
    end
  end
end
