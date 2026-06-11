require "csv"

module Api
  module E2e
    class FixturesController < Api::BaseController
      before_action :ensure_enabled

      def create
        cleanup_tag

        user = create_user!("user", role: "user")
        admin = create_user!("admin", role: "admin")
        project = Project.create!(name: tagged("project"), description: "E2E project")
        plan = project.plans.create!(
          name: "main",
          description: "Primary E2E plan",
          repository_url: "https://example.invalid/tiny-ci.git",
          steps: "step :build",
          requirements: "ruby"
        )
        slave = Slave.create!(name: tagged("worker"), protocol: "localhost", hostname: "localhost", offline: false)
        finished_build = create_build!(
          plan,
          slave: slave,
          starter: user,
          status: "success",
          position: 1,
          output_lines: ["bundle install", "bin/rails test", "Build succeeded"]
        )
        running_build = create_build!(
          plan,
          slave: slave,
          starter: user,
          status: "running",
          position: 2,
          output_lines: ["Long running command"]
        )
        plan.update_build_stats!

        render json: {
          tag: tag,
          password: password,
          user: user_payload(user),
          admin: user_payload(admin),
          project: { name: project.name },
          plan: { name: plan.name },
          builds: {
            finished: { position: finished_build.position },
            running: { position: running_build.position }
          },
          slave: { name: slave.name }
        }, status: :created
      end

      def destroy
        cleanup_tag
        render json: { ok: true }
      end

      private

      def ensure_enabled
        return if ENV["E2E_TEST"] == "1"

        render json: { errors: ["E2E fixtures are disabled"] }, status: :not_found
      end

      def tag
        @tag ||= params.require(:tag).to_s.gsub(/[^a-zA-Z0-9_-]/, "-")
      end

      def tagged(name)
        "e2e-#{tag}-#{name}"
      end

      def password
        "password123"
      end

      def create_user!(suffix, role:)
        User.create!(
          login: tagged(suffix),
          email: "#{tagged(suffix)}@example.test",
          password: password,
          password_confirmation: password,
          role: role
        )
      end

      def create_build!(plan, slave:, starter:, status:, position:, output_lines:)
        now = Time.current
        plan.builds.create!(
          slave: slave,
          starter: starter,
          status: status,
          position: position,
          revision: "abc123",
          started_at: now - 2.minutes,
          finished_at: status == "running" ? nil : now - 1.minute,
          output: output_lines.map { |line| CSV.generate_line([(now - 1.minute).to_f, "e2e", line]) }.join
        )
      end

      def user_payload(user)
        { login: user.login, email: user.email, role: user.role }
      end

      def cleanup_tag
        User.where("login LIKE ?", "e2e-#{tag}-%").destroy_all
        Project.where("name LIKE ?", "e2e-#{tag}-%").destroy_all
        Slave.where("name LIKE ?", "e2e-#{tag}-%").destroy_all
      end
    end
  end
end
