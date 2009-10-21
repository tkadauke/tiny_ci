module SimpleCI
  class QueueRunner
    def self.run
      loop do
        builds = ::Build.pending.find(:all)
        next_build = builds.find { |build| build.buildable? }
        next_build.build! if next_build
        sleep 2
      end
    end
  end
end
