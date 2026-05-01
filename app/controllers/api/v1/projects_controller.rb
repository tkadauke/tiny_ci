module Api
  module V1
    # POST /api/v1/projects/:project_id/trigger
    # ---------------------------------------------
    # Manually enqueue a build outside the webhook flow. Used by the
    # forthcoming dashboard "Re-run", the tiny-ci CLI, and the MCP server
    # so chat agents can kick a build.
    #
    # Auth: bearer token in Authorization header, matched against
    # TINY_CI_API_TOKEN. Single shared token by design — provisioned to
    # humans and bots via the env secret. If the env var is unset, the
    # endpoint refuses every request (fail-closed) so a misconfigured
    # production never accidentally accepts unauthenticated triggers.
    #
    # Body (JSON, all optional):
    #   { "branch": "main", "sha": "abc123...", "plan_id": "main" }
    # If plan_id is omitted, every root plan in the project gets a
    # build. If sha is omitted, the build runs against HEAD of the
    # branch — the runner resolves it.
    #
    # Idempotency: dedupes by (plan_id, sha) within 60 seconds against
    # Rails.cache. A retried trigger inside that window returns the
    # original build's id rather than enqueueing a duplicate.
    class ProjectsController < ::ActionController::API
      DEDUPE_WINDOW = 60.seconds

      before_action :authenticate
      before_action :load_project

      def trigger
        plans = target_plans
        return render_json({ error: "no matching plans" }, :not_found) if plans.empty?

        builds = plans.map { |plan| build_for(plan) }
        render_json(builds: builds.map { |b| serialize(b) })
      end

      # GET /api/v1/projects/:project_id/builds/:id
      # Returns current state of a single build. Used by `tiny-ci status`.
      # Scoped to the project so a token can't fish IDs across projects.
      def show_build
        build = Build.joins(:plan).where(plans: { project_id: @project.id }).find_by(id: params[:id])
        return render_json({ error: "not found" }, :not_found) unless build
        render_json(serialize(build))
      end

      private

      def authenticate
        expected = ENV["TINY_CI_API_TOKEN"].to_s
        return render_json({ error: "unauthorized" }, :unauthorized) if expected.blank?

        provided = request.headers["Authorization"].to_s.sub(/\ABearer\s+/i, "")
        unless ActiveSupport::SecurityUtils.secure_compare(expected, provided)
          render_json({ error: "unauthorized" }, :unauthorized)
        end
      end

      def load_project
        @project = Project.find_by(name: params[:project_id])
        render_json({ error: "not found" }, :not_found) unless @project
      end

      def target_plans
        if params[:plan_id].present?
          @project.plans.where(name: params[:plan_id])
        else
          @project.root_plans
        end
      end

      def build_for(plan)
        sha    = params[:sha].presence
        branch = params[:branch].presence

        if sha && (existing = recent_build(plan, sha))
          return existing
        end

        attributes = { revision: sha, parameters: { "branch" => branch, "trigger" => "api" }.compact }
        build = plan.build!(attributes.compact)
        Rails.cache.write(dedupe_key(plan, sha), build.id, expires_in: DEDUPE_WINDOW) if sha
        build
      end

      def recent_build(plan, sha)
        cached_id = Rails.cache.read(dedupe_key(plan, sha))
        plan.builds.find_by(id: cached_id) if cached_id
      end

      def dedupe_key(plan, sha)
        "tiny_ci:trigger:#{plan.id}:#{sha}"
      end

      def serialize(build)
        {
          id:       build.id,
          plan:     build.plan.name,
          status:   build.status,
          revision: build.revision,
          url:      "/projects/#{@project.to_param}/plans/#{build.plan.to_param}/builds/#{build.to_param}"
        }
      end

      def render_json(payload, status = :ok)
        render json: payload, status: status
      end
    end
  end
end
