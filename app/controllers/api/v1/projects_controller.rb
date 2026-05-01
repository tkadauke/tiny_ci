require "csv"

module Api
  module V1
    # Versioned REST surface for tiny_ci. Bearer-token auth against
    # TINY_CI_API_TOKEN — single shared token by design, provisioned to
    # humans and bots (CLI, MCP server, dashboard re-run) via the env
    # secret. Endpoint fails closed: if TINY_CI_API_TOKEN is unset,
    # every request returns 401 so a misconfigured prod never accepts
    # unauthenticated calls.
    #
    # Endpoints:
    #   GET  /api/v1/projects                              — list_projects
    #   GET  /api/v1/projects/:slug/builds                 — list_recent_builds
    #   POST /api/v1/projects/:slug/trigger                — trigger
    #   GET  /api/v1/projects/:slug/builds/:id             — show_build
    #   GET  /api/v1/projects/:slug/builds/:id/log         — get_log
    #   POST /api/v1/projects/:slug/builds/:id/cancel      — cancel_build
    class ProjectsController < ::ActionController::API
      DEDUPE_WINDOW       = 60.seconds
      RECENT_BUILDS_LIMIT = 25      # default — capped at 100 to avoid runaway responses
      RECENT_BUILDS_MAX   = 100
      LOG_TAIL_DEFAULT    = 200
      LOG_TAIL_MAX        = 5000

      before_action :authenticate
      before_action :load_project, except: [:index]

      def index
        render_json(projects: Project.order(:name).map { |p| serialize_project(p) })
      end

      def trigger
        plans = target_plans
        return render_json({ error: "no matching plans" }, :not_found) if plans.empty?

        builds = plans.map { |plan| build_for(plan) }
        render_json(builds: builds.map { |b| serialize_build(b) })
      end

      def list_recent_builds
        limit = clamp(params[:limit].to_i.nonzero? || RECENT_BUILDS_LIMIT, 1, RECENT_BUILDS_MAX)
        builds = Build.joins(:plan).where(plans: { project_id: @project.id })
                      .order(created_at: :desc).limit(limit).includes(:plan)
        render_json(builds: builds.map { |b| serialize_build(b) })
      end

      def show_build
        build = scoped_build(params[:id])
        return render_json({ error: "not found" }, :not_found) unless build
        render_json(serialize_build(build))
      end

      def get_log
        build = scoped_build(params[:id])
        return render_json({ error: "not found" }, :not_found) unless build
        tail = clamp(params[:tail].to_i.nonzero? || LOG_TAIL_DEFAULT, 1, LOG_TAIL_MAX)
        render_json(
          build_id: build.id,
          status:   build.status,
          lines:    log_lines(build, tail)
        )
      end

      def cancel_build
        build = scoped_build(params[:id])
        return render_json({ error: "not found" }, :not_found) unless build
        return render_json({ error: "build is not running", status: build.status }, :unprocessable_entity) unless build.running? || build.pending? || build.waiting?

        build.stop!
        render_json(serialize_build(build.reload))
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

      # Build output is stored as CSV: time,command,line per row. For
      # the tail-N API we return parsed line objects so MCP/CLI clients
      # don't have to re-parse CSV themselves. #22 will replace the
      # storage format; this serializer survives that change.
      def log_lines(build, tail)
        raw = build.output.to_s
        return [] if raw.empty?
        rows = raw.split("\n").last(tail)
        rows.filter_map do |row|
          parsed = CSV.parse_line(row) rescue nil
          next unless parsed && parsed.size >= 3
          { at: parsed[0]&.to_f, command: parsed[1], line: parsed[2] }
        end
      end

      def scoped_build(id)
        Build.joins(:plan).where(plans: { project_id: @project.id }).find_by(id: id)
      end

      def clamp(value, min, max)
        [[value.to_i, min].max, max].min
      end

      def serialize_project(project)
        {
          name:        project.name,
          description: project.description,
          plans:       project.plans.pluck(:name)
        }
      end

      def serialize_build(build)
        {
          id:           build.id,
          project:      build.project.name,
          plan:         build.plan.name,
          status:       build.status,
          revision:     build.revision,
          started_at:   build.started_at&.iso8601,
          finished_at:  build.finished_at&.iso8601,
          duration:     build.duration,
          url:          "/projects/#{build.project.to_param}/plans/#{build.plan.to_param}/builds/#{build.to_param}"
        }
      end

      def render_json(payload, status = :ok)
        render json: payload, status: status
      end
    end
  end
end
