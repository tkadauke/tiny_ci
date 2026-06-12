module TinyCI
  # Build scheduler. The legacy implementation (lib/tiny_ci/scheduler/) was a
  # Singleton runner that polled in a loop, forked `script/builder` per build,
  # and used DRb to receive stop signals from the web tier. None of that is
  # safe inside a multithreaded Puma, so this rewrite drops:
  #   * fork/exec  → BuildJob (ActiveJob)
  #   * DRb        → cooperative DB-status signalling
  #   * Singleton  → module-level state (none — every tick is stateless)
  #   * SIGCHLD trap → ActiveJob handles the lifecycle
  #
  # The default ActiveJob adapter (:async) runs jobs in an in-process thread
  # pool. That's fine for development and small deployments. For production
  # the modernization roadmap (§3.5) recommends Solid Queue.
  module Scheduler
    DEFAULT_INTERVAL = 0.5

    # One scheduling pass: pick the next buildable Build, find a free Worker,
    # assign, and enqueue. Designed to be called periodically (or after a
    # DB change that might unblock a build).
    def self.tick
      ActiveRecord::Base.transaction do
        next_build = Build.pending.to_a.find(&:buildable?)
        return unless next_build

        worker = Worker.find_free_worker_for(next_build)
        return unless worker

        next_build.assign_to!(worker)
        start(next_build)
      end
    rescue StandardError => e
      Rails.logger.error("Scheduler tick error: #{e.class}: #{e.message}")
      Rails.logger.error(e.backtrace.first(10).join("\n"))
    end

    def self.start(build)
      build.update(status: "running", started_at: Time.now)
      BuildJob.perform_later(build.id)
    end

    # Long-running poller. Use from a foreground rake task / supervised
    # process during development, or replace with cron / ActiveJob recurring
    # in production.
    def self.run(interval: DEFAULT_INTERVAL)
      loop do
        tick
        sleep interval
      end
    end
  end
end
