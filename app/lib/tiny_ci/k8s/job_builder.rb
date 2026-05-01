module TinyCI
  module K8s
    # Renders a Kubernetes Job manifest (as a Hash) for a given Build.
    # Pure function — no API calls, no I/O. Output is fed to the runner
    # in slice 2; tests can assert manifest shape directly.
    #
    # Manifest shape:
    #   - One init container "git-clone" that clones repository_url at
    #     build.revision into an emptyDir workspace.
    #   - One main container "build" running the project's command with
    #     the workspace mounted at /workspace.
    #   - Labels keyed off (project, plan, build) so the runner watch
    #     can find pods/logs without round-tripping the Job spec.
    #   - ttlSecondsAfterFinished so completed Jobs clean up.
    #
    # Configuration knobs read from ENV (sane defaults):
    #   TINY_CI_RUNNER_NAMESPACE   — where Jobs land (default "tiny-ci-runners")
    #   TINY_CI_RUNNER_IMAGE       — default builder image (overridable per-plan later via #88)
    #   TINY_CI_RUNNER_GIT_IMAGE   — image used by the clone init container
    #   TINY_CI_RUNNER_TTL_SECONDS — Job auto-delete window after finish
    class JobBuilder
      DEFAULT_NAMESPACE   = "tiny-ci-runners".freeze
      DEFAULT_IMAGE       = "ruby:3.2.3-slim".freeze
      DEFAULT_GIT_IMAGE   = "alpine/git:latest".freeze
      DEFAULT_TTL_SECONDS = 3600       # 1 hour: long enough to grab logs after a slow finish.
      DEFAULT_BACKOFF     = 0          # No retries — the build framework handles re-runs.
      WORKSPACE_PATH      = "/workspace".freeze

      def initialize(build)
        @build = build
      end

      def to_h
        {
          apiVersion: "batch/v1",
          kind:       "Job",
          metadata:   metadata,
          spec:       spec
        }
      end

      private

      attr_reader :build

      def metadata
        {
          name:      job_name,
          namespace: namespace,
          labels:    labels
        }
      end

      def labels
        {
          "app.kubernetes.io/name"      => "tiny-ci-runner",
          "app.kubernetes.io/component" => "build",
          "tiny-ci/build-id"            => build.id.to_s,
          "tiny-ci/project"             => build.project.to_param.to_s,
          "tiny-ci/plan"                => build.plan.to_param.to_s
        }
      end

      def spec
        {
          ttlSecondsAfterFinished: ENV.fetch("TINY_CI_RUNNER_TTL_SECONDS", DEFAULT_TTL_SECONDS).to_i,
          backoffLimit:            DEFAULT_BACKOFF,
          template: {
            metadata: { labels: labels },
            spec: {
              restartPolicy:  "Never",
              initContainers: [git_clone_container],
              containers:     [build_container],
              volumes:        [workspace_volume]
            }
          }
        }
      end

      def git_clone_container
        {
          name:    "git-clone",
          image:   ENV.fetch("TINY_CI_RUNNER_GIT_IMAGE", DEFAULT_GIT_IMAGE),
          command: ["sh", "-ce", git_clone_script],
          volumeMounts: [{ name: "workspace", mountPath: WORKSPACE_PATH }]
        }
      end

      # Clone shallow at the requested SHA. We use `git fetch` instead
      # of plain `clone` so refs that aren't on a branch (PR head SHAs)
      # also resolve cleanly.
      def git_clone_script
        repo = build.repository_url
        sha  = build.revision
        <<~SH.strip
          set -ex
          cd #{WORKSPACE_PATH}
          git init -q
          git remote add origin #{shell_escape(repo)}
          git fetch --depth=1 origin #{shell_escape(sha)}
          git checkout FETCH_HEAD
        SH
      end

      def build_container
        {
          name:    "build",
          image:   image_for_build,
          command: ["sh", "-ce", build_script],
          workingDir:   WORKSPACE_PATH,
          volumeMounts: [{ name: "workspace", mountPath: WORKSPACE_PATH }],
          env:       env_vars,
          resources: resource_requirements
        }
      end

      # Slice 1 reads steps off the legacy Plan.steps DSL when it looks
      # like a flat shell snippet. Anything more sophisticated will hook
      # into TinyCI::DSL evaluation in slice 2; for now, untyped steps
      # just become the script body, and an empty Plan no-ops with a
      # clear message so the Job exits non-zero.
      def build_script
        steps = build.plan.steps.to_s.strip
        return %(echo "no build steps configured for plan #{build.plan.name}"; exit 1) if steps.empty?
        steps
      end

      def env_vars
        slave_env = parse_environment_variables(build.slave&.environment_variables)
        param_env = (build.environment || {}).slice("branch", "sha", "event", "pr_number")
        slave_env.merge(param_env).map { |k, v| { name: k.to_s, value: v.to_s } }
      end

      # Plan.requirements stores a serialized resource hash via
      # TinyCI::Resources::Parser. Map it to k8s requests/limits with
      # sensible defaults so an unconfigured plan still gets a small,
      # bounded slot.
      def resource_requirements
        parsed = build.needed_resources rescue {}
        {
          requests: {
            cpu:    parsed[:cpu]    || "100m",
            memory: parsed[:memory] || "256Mi"
          },
          limits: {
            cpu:    parsed[:cpu_limit]    || parsed[:cpu]    || "1",
            memory: parsed[:memory_limit] || parsed[:memory] || "1Gi"
          }
        }
      end

      def workspace_volume
        { name: "workspace", emptyDir: {} }
      end

      def image_for_build
        ENV.fetch("TINY_CI_RUNNER_IMAGE", DEFAULT_IMAGE)
      end

      def namespace
        ENV.fetch("TINY_CI_RUNNER_NAMESPACE", DEFAULT_NAMESPACE)
      end

      # k8s job names: DNS-1123, max 63 chars. Project/plan names are
      # already constrained to [a-zA-Z0-9_-] by their validators, so we
      # only need to lowercase, swap underscores, and truncate.
      def job_name
        slug = "tinyci-#{build.project.to_param}-#{build.plan.to_param}-#{build.id}".downcase.tr("_", "-")
        slug[0, 63]
      end

      # Slave environment_variables historically stored as
      # KEY=value\nKEY2=value2 multi-line strings.
      def parse_environment_variables(raw)
        return {} if raw.blank?
        raw.to_s.split(/\R/).each_with_object({}) do |line, out|
          key, _, value = line.partition("=")
          out[key.strip] = value.strip if key.strip.present?
        end
      end

      def shell_escape(value)
        "'#{value.to_s.gsub("'", "'\\''")}'"
      end
    end
  end
end
