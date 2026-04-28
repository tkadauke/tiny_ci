module TinyCI
  module Scheduler
    # Stop signalling. The legacy implementation called into a DRb server
    # which had SIGTERM-killed the forked builder process; that doesn't
    # exist any more. Stopping is now a DB-only state change.
    #
    # Cooperative cancellation gap: an in-flight BuildJob keeps running
    # until it returns from the shell. The build will end up frozen at
    # `stopping` until then, and the eventual `update(status: "...")` from
    # build! overwrites it. Real mid-build interruption requires the job
    # to poll the DB or an interrupt channel — tracked alongside the
    # Solid Queue migration (§3.5).
    class Client
      def self.stop(build)
        build.update(status: "stopping")
      end
    end
  end
end
