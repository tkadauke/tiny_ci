module TinyCI
  module Api
    class BuildSerializer
      def initialize(build, include_output: false)
        @build = build
        @include_output = include_output
      end

      def as_json(*)
        payload = {
          id: build.id,
          name: build.name,
          position: build.position,
          status: build.status,
          status_icon_path: helpers.asset_path("icons/small/#{build.status}.png"),
          status_text: I18n.t("build.status.#{build.status}"),
          created_at: build.created_at,
          finished_at: build.finished_at,
          duration: build.duration,
          revision: build.revision,
          slave: slave_json,
          starter_id: build.starter_id,
          starter_login: build.starter&.login,
          plan: plan_json,
          has_children: build.has_children?,
          children: build.children.map { |child| self.class.new(child).as_json }
        }
        payload[:output_rows] = output_rows if include_output
        payload
      end

      private

      attr_reader :build, :include_output

      def helpers
        ActionController::Base.helpers
      end

      def plan_json
        {
          name: build.plan.name,
          project_name: build.project.name,
          project_id: build.project.to_param,
          plan_id: build.plan.to_param
        }
      end

      def slave_json
        return nil unless build.slave

        {
          name: build.slave.name
        }
      end

      def output_rows
        TinyCI::Output.new(build.output || "").each_with_index.map do |row, index|
          {
            index: index,
            timestamp: row.timestamp,
            command: row.command,
            line: row.line
          }
        end
      end
    end
  end
end
