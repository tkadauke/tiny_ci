require_relative "../../../test_helper"

class Api::V1::ProjectsControllerTest < ActionController::TestCase
  TOKEN = "secret-bearer-token".freeze

  setup do
    @project = Project.create!(name: "raytracer")
    @plan_a  = @project.plans.create!(name: "main",  repository_url: "https://example.com/a.git")
    @plan_b  = @project.plans.create!(name: "tests", repository_url: "https://example.com/a.git")

    ENV["TINY_CI_API_TOKEN"] = TOKEN
    Rails.cache = ActiveSupport::Cache::MemoryStore.new
  end

  teardown do
    ENV.delete("TINY_CI_API_TOKEN")
    Rails.cache = ActiveSupport::Cache::NullStore.new
  end

  test "trigger without bearer returns 401" do
    post :trigger, params: { project_id: "raytracer" }
    assert_response :unauthorized
    assert_equal 0, Build.count
  end

  test "trigger with wrong token returns 401" do
    @request.headers["Authorization"] = "Bearer not-the-real-token"
    post :trigger, params: { project_id: "raytracer" }
    assert_response :unauthorized
    assert_equal 0, Build.count
  end

  test "trigger fails closed when TINY_CI_API_TOKEN is unset" do
    ENV.delete("TINY_CI_API_TOKEN")
    @request.headers["Authorization"] = "Bearer #{TOKEN}"
    post :trigger, params: { project_id: "raytracer" }
    assert_response :unauthorized
  end

  test "trigger with no plan_id queues a build per root plan" do
    @request.headers["Authorization"] = "Bearer #{TOKEN}"
    assert_difference "Build.count", 2 do
      post :trigger, params: { project_id: "raytracer" }, body: JSON.generate(branch: "main"), as: :json
    end
    assert_response :success
    plans = JSON.parse(response.body)["builds"].map { |b| b["plan"] }.sort
    assert_equal %w[main tests], plans
  end

  test "trigger with plan_id only queues that plan" do
    @request.headers["Authorization"] = "Bearer #{TOKEN}"
    assert_difference "Build.count", 1 do
      post :trigger, params: { project_id: "raytracer" }, body: JSON.generate(plan_id: "main"), as: :json
    end
    builds = JSON.parse(response.body)["builds"]
    assert_equal 1, builds.size
    assert_equal "main", builds.first["plan"]
  end

  test "trigger persists branch/trigger metadata into Build.parameters" do
    @request.headers["Authorization"] = "Bearer #{TOKEN}"
    post :trigger, params: { project_id: "raytracer" }, body: JSON.generate(plan_id: "main", branch: "topic"), as: :json
    build = Build.find(JSON.parse(response.body)["builds"].first["id"])
    assert_equal "topic", build.environment["branch"]
    assert_equal "api",   build.environment["trigger"]
  end

  test "trigger with same plan+sha within 60s returns the existing build" do
    @request.headers["Authorization"] = "Bearer #{TOKEN}"
    post :trigger, params: { project_id: "raytracer" },
                   body: JSON.generate(plan_id: "main", sha: "deadbeef" * 5),
                   as: :json
    first_id = JSON.parse(response.body)["builds"].first["id"]

    assert_no_difference "Build.count" do
      post :trigger, params: { project_id: "raytracer" },
                     body: JSON.generate(plan_id: "main", sha: "deadbeef" * 5),
                     as: :json
    end
    second_id = JSON.parse(response.body)["builds"].first["id"]
    assert_equal first_id, second_id
  end

  test "trigger for unknown project returns 404" do
    @request.headers["Authorization"] = "Bearer #{TOKEN}"
    post :trigger, params: { project_id: "no-such-project" }
    assert_response :not_found
  end

  test "trigger with plan_id that doesn't exist returns 404" do
    @request.headers["Authorization"] = "Bearer #{TOKEN}"
    post :trigger, params: { project_id: "raytracer" }, body: JSON.generate(plan_id: "no-such"), as: :json
    assert_response :not_found
  end

  test "show_build returns build details for a build in this project" do
    build = @plan_a.builds.create!(status: "running", revision: "cafe" * 10)
    @request.headers["Authorization"] = "Bearer #{TOKEN}"
    get :show_build, params: { project_id: "raytracer", id: build.id }
    assert_response :success
    payload = JSON.parse(response.body)
    assert_equal build.id,  payload["id"]
    assert_equal "running", payload["status"]
  end

  test "show_build refuses to leak builds across projects" do
    other_project = Project.create!(name: "other")
    other_plan    = other_project.plans.create!(name: "main")
    other_build   = other_plan.builds.create!(status: "success")
    @request.headers["Authorization"] = "Bearer #{TOKEN}"
    get :show_build, params: { project_id: "raytracer", id: other_build.id }
    assert_response :not_found
  end

  # index ──────────────────────────────────────────────────────────────────────

  test "index lists all projects with their plan names" do
    other = Project.create!(name: "graphics")
    other.plans.create!(name: "ci")
    @request.headers["Authorization"] = "Bearer #{TOKEN}"
    get :index
    assert_response :success
    projects = JSON.parse(response.body)["projects"]
    names = projects.map { |p| p["name"] }.sort
    assert_equal %w[graphics raytracer], names
    raytracer = projects.find { |p| p["name"] == "raytracer" }
    assert_equal %w[main tests].sort, raytracer["plans"].sort
  end

  # list_recent_builds ─────────────────────────────────────────────────────────

  test "list_recent_builds returns builds for the project, newest first" do
    build1 = @plan_a.builds.create!(status: "success")
    build2 = @plan_a.builds.create!(status: "running")
    @request.headers["Authorization"] = "Bearer #{TOKEN}"
    get :list_recent_builds, params: { project_id: "raytracer" }
    assert_response :success
    ids = JSON.parse(response.body)["builds"].map { |b| b["id"] }
    assert_includes ids, build1.id
    assert_includes ids, build2.id
  end

  test "list_recent_builds respects limit parameter" do
    5.times { @plan_a.builds.create!(status: "success") }
    @request.headers["Authorization"] = "Bearer #{TOKEN}"
    get :list_recent_builds, params: { project_id: "raytracer", limit: 2 }
    assert_response :success
    assert_equal 2, JSON.parse(response.body)["builds"].size
  end

  test "list_recent_builds clamps limit to 100" do
    @request.headers["Authorization"] = "Bearer #{TOKEN}"
    get :list_recent_builds, params: { project_id: "raytracer", limit: 9999 }
    assert_response :success
  end

  test "list_recent_builds does not expose builds from other projects" do
    other_project = Project.create!(name: "other")
    other_plan    = other_project.plans.create!(name: "main")
    other_build   = other_plan.builds.create!(status: "success")
    @request.headers["Authorization"] = "Bearer #{TOKEN}"
    get :list_recent_builds, params: { project_id: "raytracer" }
    ids = JSON.parse(response.body)["builds"].map { |b| b["id"] }
    assert_not_includes ids, other_build.id
  end

  # get_log ────────────────────────────────────────────────────────────────────

  test "get_log returns empty lines for a build with no output" do
    build = @plan_a.builds.create!(status: "pending")
    @request.headers["Authorization"] = "Bearer #{TOKEN}"
    get :get_log, params: { project_id: "raytracer", id: build.id }
    assert_response :success
    body = JSON.parse(response.body)
    assert_equal build.id, body["build_id"]
    assert_equal [],       body["lines"]
  end

  test "get_log parses CSV output into structured line objects" do
    build = @plan_a.builds.create!(status: "success",
      output: "1700000001.0,bundle exec rake,Starting...\n1700000002.0,bundle exec rake,Done.")
    @request.headers["Authorization"] = "Bearer #{TOKEN}"
    get :get_log, params: { project_id: "raytracer", id: build.id }
    lines = JSON.parse(response.body)["lines"]
    assert_equal 2, lines.size
    assert_equal "Starting...", lines.first["line"]
    assert_in_delta 1700000001.0, lines.first["at"], 0.001
  end

  test "get_log tail parameter limits returned lines" do
    rows = 10.times.map { |i| "170000000#{i}.0,cmd,line #{i}" }.join("\n")
    build = @plan_a.builds.create!(status: "success", output: rows)
    @request.headers["Authorization"] = "Bearer #{TOKEN}"
    get :get_log, params: { project_id: "raytracer", id: build.id, tail: 3 }
    assert_equal 3, JSON.parse(response.body)["lines"].size
  end

  test "get_log returns 404 for unknown build" do
    @request.headers["Authorization"] = "Bearer #{TOKEN}"
    get :get_log, params: { project_id: "raytracer", id: 99999 }
    assert_response :not_found
  end

  # cancel_build ───────────────────────────────────────────────────────────────

  test "cancel_build stops a running build" do
    build = @plan_a.builds.create!(status: "running")
    @request.headers["Authorization"] = "Bearer #{TOKEN}"
    post :cancel_build, params: { project_id: "raytracer", id: build.id }
    assert_response :success
    assert_equal "stopping", JSON.parse(response.body)["status"]
  end

  test "cancel_build returns 422 for a build that already finished" do
    build = @plan_a.builds.create!(status: "success")
    @request.headers["Authorization"] = "Bearer #{TOKEN}"
    post :cancel_build, params: { project_id: "raytracer", id: build.id }
    assert_response :unprocessable_entity
  end

  test "cancel_build returns 404 for an unknown build" do
    @request.headers["Authorization"] = "Bearer #{TOKEN}"
    post :cancel_build, params: { project_id: "raytracer", id: 99999 }
    assert_response :not_found
  end
end
