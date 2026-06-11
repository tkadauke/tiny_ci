module TinyCI
  module Api
    class DashboardPayload
      def as_json(*)
        {
          queue: serialize_builds(Build.pending.includes(:starter, plan: :project, children: [:starter, { plan: :project }])),
          slaves: Slave.all.includes(running_builds: [:starter, { plan: :project }, { children: [:starter, { plan: :project }] }]).map { |slave| slave_json(slave) },
          recent_builds: serialize_builds(Build.finished.includes(:starter, plan: :project, children: [:starter, { plan: :project }]).order(created_at: :desc).limit(5))
        }
      end

      private

      def serialize_builds(builds)
        builds.map { |build| BuildSerializer.new(build).as_json }
      end

      def slave_json(slave)
        {
          name: slave.name,
          offline: slave.offline?,
          running_builds: serialize_builds(slave.running_builds)
        }
      end
    end
  end
end
