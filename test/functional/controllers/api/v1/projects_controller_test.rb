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
end
