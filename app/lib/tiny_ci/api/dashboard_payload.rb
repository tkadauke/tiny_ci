module TinyCI
  module Api
    class DashboardPayload
      def as_json(*)
        {
          queue: serialize_builds(Build.pending.includes(:worker, :starter, plan: :project, children: [:worker, :starter, { plan: :project }])),
          workers: Worker.all.includes(running_builds: [:worker, :starter, { plan: :project }, { children: [:worker, :starter, { plan: :project }] }]).map { |worker| worker_json(worker) },
          recent_builds: serialize_builds(Build.finished.includes(:worker, :starter, plan: :project, children: [:worker, :starter, { plan: :project }]).order(created_at: :desc).limit(5))
        }
      end

      private

      def serialize_builds(builds)
        builds.map { |build| BuildSerializer.new(build).as_json }
      end

      def worker_json(worker)
        {
          name: worker.name,
          offline: worker.offline?,
          running_builds: serialize_builds(worker.running_builds)
        }
      end
    end
  end
end
