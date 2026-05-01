require "octokit"

module TinyCI
  module GitHub
    # Posts and updates a GitHub Check Run that mirrors a Build's
    # lifecycle. One Check Run per Build, identified by the SHA on the
    # Build (`revision`) and the project's GitHub repo. The Check Run id
    # is persisted on the Build so subsequent state changes patch the
    # same record.
    #
    # Slice 1 handles three transitions:
    #   pending → queued (on Build creation)
    #   running → in_progress (on first status update to "running")
    #   terminal → completed/<conclusion> (on finish)
    #
    # Failures (network blip, GitHub down, missing config) are caught
    # and logged so the build pipeline never hard-fails because of
    # status reporting.
    class CheckRunReporter
      class << self
        # Single entry point called from Build callbacks. Decides which
        # transition (if any) to report based on the Build's current
        # state and whether a Check Run already exists.
        def report(build)
          return unless eligible?(build)

          if build.github_check_run_id.blank?
            create_for(build)
          else
            update_for(build)
          end
        rescue StandardError => e
          Rails.logger.error("[github] check run failed for build=#{build.id}: #{e.class}: #{e.message}")
        end

        private

        # Skip silently when GitHub isn't configured globally or the
        # project hasn't been connected to a repo. A project can opt
        # out by leaving github_repo_full_name blank.
        def eligible?(build)
          return false unless TinyCI::GitHub.configured?
          project = build.project
          return false if project.nil?
          project.github_installation_id.present? &&
            project.github_repo_full_name.present? &&
            build.revision.present?
        end

        def create_for(build)
          project = build.project
          client  = App.installation_client(project.github_installation_id)
          attrs   = check_run_attributes(build).merge(
            name:     check_run_name(build),
            head_sha: build.revision
          )
          run = client.create_check_run(project.github_repo_full_name, attrs[:name], attrs[:head_sha], attrs.except(:name, :head_sha))
          build.update_columns(github_check_run_id: run.id) if run&.id
        end

        def update_for(build)
          project = build.project
          client  = App.installation_client(project.github_installation_id)
          client.update_check_run(
            project.github_repo_full_name,
            build.github_check_run_id,
            check_run_attributes(build)
          )
        end

        # GitHub Check Runs accept status ∈ {queued, in_progress, completed}
        # and, when completed, conclusion ∈ {success, failure, neutral,
        # cancelled, skipped, timed_out, action_required}.
        def check_run_attributes(build)
          base = { details_url: details_url_for(build) }
          case build.status
          when "pending"
            base.merge(status: "queued")
          when "running", "waiting", "stopping"
            base.merge(status: "in_progress", started_at: build.started_at&.iso8601)
          when "success"
            base.merge(status: "completed", conclusion: "success", completed_at: completed_at(build), output: summary_output(build))
          when "failure", "error"
            base.merge(status: "completed", conclusion: "failure", completed_at: completed_at(build), output: summary_output(build))
          when "canceled", "stopped"
            base.merge(status: "completed", conclusion: "cancelled", completed_at: completed_at(build), output: summary_output(build))
          else
            base.merge(status: "queued")
          end
        end

        def check_run_name(build)
          "tiny_ci / #{build.plan.name}"
        end

        # Best-effort URL to the build dashboard page. The host is
        # configured per-environment; falls back to the relative path
        # if no host is set so the link is at least pasteable.
        def details_url_for(build)
          host = ENV["TINY_CI_PUBLIC_URL"].presence
          path = "/projects/#{build.project.to_param}/plans/#{build.plan.to_param}/builds/#{build.to_param}"
          host ? "#{host.chomp("/")}#{path}" : path
        end

        def completed_at(build)
          (build.finished_at || Time.current).iso8601
        end

        # Markdown summary for the Check Run. Slice 1 keeps it small —
        # status, plan/project, duration, and a tail of the output. The
        # follow-up will add re-run / open-in-tinyci affordances.
        def summary_output(build)
          tail = (build.output.to_s.split("\n").last(50)).join("\n")
          {
            title:   "tiny_ci #{build.status}",
            summary: "Project **#{build.project.name}** / Plan **#{build.plan.name}**\n" \
                     "Duration: #{build.duration ? "#{build.duration.round(1)}s" : "—"}\n" \
                     "Revision: `#{build.revision}`",
            text:    tail.present? ? "```\n#{tail}\n```" : nil
          }.compact
        end
      end
    end
  end
end
