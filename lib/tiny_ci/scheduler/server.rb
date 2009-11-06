module TinyCI
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
        
        build.update_attributes :status => 'canceled', :finished_at => Time.now
        pid = processes[build.id]
        if pid
          Process.kill("TERM", pid)
        end
      end
      
      def finished(build_id)
        build = Build.find(build_id)
        
        plan = Project.find(build.plan_id)
        if build.waiting? && plan.has_children?
          plan.build_children!(build)
        end
      end
      
      def run
        loop do
          begin
            builds = ::Build.pending.find(:all)
            next_build = builds.find { |build| build.buildable? }
            if next_build
              slave = Slave.find_free_slave_for(next_build)
              if slave
                next_build.assign_to!(slave)
                start(next_build)
              end
            end
            sleep 2
          rescue => e
            puts e.message, e.backtrace
          end
        end
      end
      
      def start(build)
        build.update_attributes :status => 'running', :started_at => Time.now
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
