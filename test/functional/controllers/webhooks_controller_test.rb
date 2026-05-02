require_relative "../test_helper"
require "openssl"

class WebhooksControllerTest < ActionController::TestCase
  SECRET = "shh-its-a-secret".freeze
  REPO_URL = "https://github.com/example/repo.git".freeze

  setup do
    @project = Project.create!(
      name: "webhook_project",
      webhook_secret: SECRET
    )
    @plan = @project.plans.create!(name: "main", repository_url: REPO_URL)
  end

  test "ping event returns 200 and creates no build" do
    body = JSON.generate({})
    post_webhook(event: "ping", body: body)

    assert_response :success
    assert_equal 0, @plan.builds.count
  end

  test "push with valid signature creates a build with the head SHA" do
    body = JSON.generate(
      after: "deadbeef" * 5,
      ref:   "refs/heads/main",
      repository: { clone_url: REPO_URL }
    )
    assert_difference "@plan.builds.count", 1 do
      post_webhook(event: "push", body: body)
    end
    assert_response :success

    build = @plan.builds.last
    assert_equal "deadbeef" * 5, build.revision
    assert_equal "pending",      build.status
    assert_equal "push",         build.environment["event"]
    assert_equal "main",         build.environment["branch"]
  end

  test "push with bad signature returns 401 and creates no build" do
    body = JSON.generate(after: "x" * 40, ref: "refs/heads/main",
                         repository: { clone_url: REPO_URL })
    assert_no_difference "Build.count" do
      post_webhook(event: "push", body: body, signature: "sha256=wrong")
    end
    assert_response :unauthorized
  end

  test "push with missing signature header returns 401" do
    body = JSON.generate(after: "x" * 40, ref: "refs/heads/main",
                         repository: { clone_url: REPO_URL })
    assert_no_difference "Build.count" do
      post_webhook(event: "push", body: body, signature: nil)
    end
    assert_response :unauthorized
  end

  test "push for a repo url that no plan matches creates no build" do
    body = JSON.generate(
      after: "abc" * 14,
      ref:   "refs/heads/main",
      repository: { clone_url: "https://github.com/other/repo.git" }
    )
    assert_no_difference "Build.count" do
      post_webhook(event: "push", body: body)
    end
    assert_response :success
  end

  test "branch deletion (zero SHA) creates no build" do
    body = JSON.generate(
      after: "0" * 40,
      ref:   "refs/heads/gone",
      repository: { clone_url: REPO_URL }
    )
    assert_no_difference "Build.count" do
      post_webhook(event: "push", body: body)
    end
    assert_response :success
  end

  test "pull_request opened creates a build for the PR head SHA" do
    body = JSON.generate(
      action: "opened",
      pull_request: {
        number: 42,
        head: { sha: "feedface" * 5, ref: "topic-branch" }
      },
      repository: { clone_url: REPO_URL }
    )
    assert_difference "@plan.builds.count", 1 do
      post_webhook(event: "pull_request", body: body)
    end

    build = @plan.builds.last
    assert_equal "feedface" * 5,   build.revision
    assert_equal "pull_request",   build.environment["event"]
    assert_equal 42,               build.environment["pr_number"]
    assert_equal "topic-branch",   build.environment["branch"]
  end

  test "pull_request closed creates no build" do
    body = JSON.generate(
      action: "closed",
      pull_request: { number: 1, head: { sha: "a" * 40, ref: "x" } },
      repository: { clone_url: REPO_URL }
    )
    assert_no_difference "Build.count" do
      post_webhook(event: "pull_request", body: body)
    end
    assert_response :success
  end

  test "webhooks_enabled=false returns 200 with no build" do
    @project.update!(webhooks_enabled: false)
    body = JSON.generate(after: "a" * 40, ref: "refs/heads/main",
                         repository: { clone_url: REPO_URL })
    assert_no_difference "Build.count" do
      post_webhook(event: "push", body: body)
    end
    assert_response :success
  end

  test "unknown project returns 404" do
    body = JSON.generate({})
    @request.headers["X-GitHub-Event"]      = "ping"
    @request.headers["X-Hub-Signature-256"] = "sha256=irrelevant"
    post :github, params: { project_id: "no-such-project" }, body: body
    assert_response :not_found
  end

  test "duplicate delivery for same sha+event is ignored" do
    Rails.cache = ActiveSupport::Cache::MemoryStore.new
    body = JSON.generate(after: "c" * 40, ref: "refs/heads/main",
                         repository: { clone_url: REPO_URL })
    assert_difference "Build.count", 1 do
      post_webhook(event: "push", body: body)
      post_webhook(event: "push", body: body) # retry
    end
  ensure
    Rails.cache = ActiveSupport::Cache::NullStore.new
  end

  private

  def post_webhook(event:, body:, signature: :compute, project: @project.name)
    sig = signature == :compute ? sign(body) : signature
    @request.headers["X-GitHub-Event"]      = event
    @request.headers["X-Hub-Signature-256"] = sig if sig
    post :github, params: { project_id: project }, body: body
  end

  def sign(body, secret = SECRET)
    "sha256=" + OpenSSL::HMAC.hexdigest("SHA256", secret, body)
  end
end
