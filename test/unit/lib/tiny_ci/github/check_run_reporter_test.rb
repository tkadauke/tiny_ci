require_relative "../../../../test_helper"

class TinyCI::GitHub::CheckRunReporterTest < ActiveSupport::TestCase
  setup do
    @project = Project.create!(
      name: "gh_project",
      github_installation_id: 99,
      github_repo_full_name: "owner/repo"
    )
    @plan  = @project.plans.create!(name: "main", repository_url: "https://github.com/owner/repo.git")
    @build = @plan.builds.create!(status: "pending", revision: "deadbeef" * 5)

    TinyCI::GitHub.stubs(:configured?).returns(true)
    @client = mock
    TinyCI::GitHub::App.stubs(:installation_client).with(99).returns(@client)
  end

  test "skips silently when GitHub is not configured" do
    TinyCI::GitHub.stubs(:configured?).returns(false)
    @client.expects(:create_check_run).never
    TinyCI::GitHub::CheckRunReporter.report(@build)
  end

  test "skips when project has no installation id" do
    @project.update!(github_installation_id: nil)
    @client.expects(:create_check_run).never
    TinyCI::GitHub::CheckRunReporter.report(@build)
  end

  test "skips when build has no revision" do
    @build.update!(revision: nil)
    @client.expects(:create_check_run).never
    TinyCI::GitHub::CheckRunReporter.report(@build)
  end

  test "creates a queued check run on first report and persists the id" do
    @client.expects(:create_check_run).with(
      "owner/repo",
      "tiny_ci / main",
      "deadbeef" * 5,
      has_entries(status: "queued")
    ).returns(stub(id: 555))

    TinyCI::GitHub::CheckRunReporter.report(@build)
    assert_equal 555, @build.reload.github_check_run_id
  end

  test "updates existing check run on status change to running" do
    @build.update_columns(github_check_run_id: 555, status: "running", started_at: Time.current)
    @client.expects(:update_check_run).with(
      "owner/repo",
      555,
      has_entries(status: "in_progress")
    )
    TinyCI::GitHub::CheckRunReporter.report(@build)
  end

  test "completes with failure conclusion on failure" do
    @build.update_columns(github_check_run_id: 555, status: "failure", finished_at: Time.current)
    @client.expects(:update_check_run).with(
      "owner/repo",
      555,
      has_entries(status: "completed", conclusion: "failure")
    )
    TinyCI::GitHub::CheckRunReporter.report(@build)
  end

  test "completes with cancelled conclusion on stopped" do
    @build.update_columns(github_check_run_id: 555, status: "stopped", finished_at: Time.current)
    @client.expects(:update_check_run).with(
      "owner/repo",
      555,
      has_entries(status: "completed", conclusion: "cancelled")
    )
    TinyCI::GitHub::CheckRunReporter.report(@build)
  end

  test "logs and swallows network errors so the build pipeline is unaffected" do
    @client.stubs(:create_check_run).raises(Octokit::ServerError, "500")
    Rails.logger.expects(:error).with(regexp_matches(/check run failed/))

    assert_nothing_raised do
      TinyCI::GitHub::CheckRunReporter.report(@build)
    end
  end

  test "Build callbacks invoke the reporter on create and on status change" do
    TinyCI::GitHub::CheckRunReporter.expects(:report).at_least(2)
    fresh = @plan.builds.create!(status: "pending", revision: "abc" * 14)
    fresh.update!(status: "running", started_at: Time.current)
  end
end
