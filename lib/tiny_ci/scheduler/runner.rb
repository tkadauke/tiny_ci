module TinyCI
  module Scheduler
    class Runner
      include Singleton
      
      def self.run
        instance.run
      end
      
      attr_reader :queue
      
      def initialize
        @queue = MessageQueue.new
        
        trap("CLD") do
          pid = Process.wait
          process_finished(pid)
        end
      end

      def run
        loop do
          ActiveRecord::Base.transaction do
            poll_messages!
            schedule!
          end
          sleep 0.5
        end
      end
      
      def poll_messages!
        while !@queue.empty?
          message = @queue.pop
          
          send(message.command, message.build)
        end
      end

      def schedule!
        begin
          builds = Build.pending.find(:all)
          next_build = builds.find { |build| build.buildable? }
          if next_build
            slave = Slave.find_free_slave_for(next_build)
            if slave
              next_build.assign_to!(slave)
              start(next_build)
            end
          end
        rescue => e
          puts e.message, e.backtrace
        end
      end

      def start(build)
        build.update_attributes :status => 'running', :started_at => Time.now
        processes[build.id] = fork { exec "script/builder", build.id.to_s }
      end

      def stop(build)
        build.update_attributes :status => 'canceled', :finished_at => Time.now
        pid = processes[build.id]
        if pid
          Process.kill("TERM", pid)
        end
      end

      def finished(build_id)
        build = Build.find(build_id)

        plan = Plan.find(build.plan_id)
        if build.waiting? && plan.has_children?
          plan.build_children!(build)
        end
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
