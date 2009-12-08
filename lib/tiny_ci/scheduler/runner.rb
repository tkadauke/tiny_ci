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
        pid = processes[build.id]
        if pid
          Process.kill("TERM", pid)
          build.update_attributes :status => 'stopped', :finished_at => Time.now
        else
          build.update_attributes :status => 'canceled', :finished_at => Time.now
        end
      end

      def finished(build_id)
        build = Build.find(build_id)
        if build.waiting?
          plan = Plan.find(build.plan_id)
          if plan.has_children?
            sleep 0.5
            plan.build_children!(build)
          end
        end
      end

    private
      def processes
        @processes ||= {}
      end

      def process_finished(pid)
        build_id = processes.invert[pid]
        processes.delete(build_id)
        finished(build_id) if build_id
      end
    end
  end
end
