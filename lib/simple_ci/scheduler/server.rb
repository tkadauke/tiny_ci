module SimpleCI
  module Scheduler
    class Server
      include Singleton
    
      def self.run
        instance.run
      end
      
      def initialize
        trap("CLD") do
          pid = Process.wait
          process_finished(pid)
        end
      end
    
      def stop(build_id)
        build = Build.find(build_id)
        
        build.update_attributes :status => 'canceled'
        pid = processes[build.id]
        if pid
          Process.kill("TERM", pid)
        end
      end
      
      def finished(build_id)
        build = Build.find(build_id)
        
        project = Project.find(build.project_id)
        if build.waiting? && project.has_children?
          project.build_children!(build)
        end
      end
      
      def run
        loop do
          builds = ::Build.pending.find(:all)
          next_build = builds.find { |build| build.buildable? }
          if next_build
            slave = Slave.find_free_slave
            if slave
              next_build.assign_to!(slave)
              start(next_build)
            end
          end
          sleep 2
        end
      end
      
      def start(build)
        build.update_attributes :status => 'running'
        processes[build.id] = fork { exec "script/builder", build.id.to_s }
      end
  
    private
      def processes
        @processes ||= {}
      end
      
      def process_finished(pid)
        build_id = processes.invert[pid]
        processes.delete(build_id)
        finished(build_id)
      end
    end
  end
end
