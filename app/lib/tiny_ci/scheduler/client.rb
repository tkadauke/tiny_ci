module TinyCI
  module Scheduler
    # Stop signalling. The legacy implementation called into a DRb server
    # which had SIGTERM-killed the forked builder process; that doesn't
    # exist any more.
    #
    # Cancellation is now cooperative: this method only flips the build's
    # status to "stopping". The running BuildJob's shell loop polls the DB
    # at `STOP_CHECK_INTERVAL` (see Shell::Localhost / Shell::SSH) and
    # raises TinyCI::BuildStopped, which Build#build! catches and finalizes
    # as "stopped". Worst-case latency between clicking Stop and the build
    # actually halting is one poll interval plus the time the current shell
    # line takes to flush.
    #
    # A more aggressive interrupt (Solid Queue's job interrupt mechanism)
    # is the eventual answer alongside the broader queue migration (#21,
    # #25); this Option-1 approach gets us most of the way without that
    # dependency.
    class Client
      def self.stop(build)
        build.update(status: "stopping")
      end
    end
  end
end
