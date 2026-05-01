require_relative "../../../../test_helper"

class TinyCI::K8s::JobBuilderTest < ActiveSupport::TestCase
  setup do
    @project = Project.create!(name: "raytracer")
    @plan    = @project.plans.create!(
      name:           "main",
      repository_url: "https://github.com/example/raytracer.git",
      steps:          "bundle exec rake test"
    )
    @build = @plan.builds.create!(status: "pending", revision: "deadbeef" * 5)
  end

  teardown do
    %w[TINY_CI_RUNNER_NAMESPACE TINY_CI_RUNNER_IMAGE TINY_CI_RUNNER_GIT_IMAGE TINY_CI_RUNNER_TTL_SECONDS].each { |k| ENV.delete(k) }
  end

  def manifest
    TinyCI::K8s::JobBuilder.new(@build).to_h
  end

  test "renders a batch/v1 Job with default namespace" do
    m = manifest
    assert_equal "batch/v1", m[:apiVersion]
    assert_equal "Job",      m[:kind]
    assert_equal "tiny-ci-runners", m[:metadata][:namespace]
  end

  test "respects TINY_CI_RUNNER_NAMESPACE override" do
    ENV["TINY_CI_RUNNER_NAMESPACE"] = "ci-runners"
    assert_equal "ci-runners", manifest[:metadata][:namespace]
  end

  test "job name is dns-safe and embeds the build id" do
    name = manifest[:metadata][:name]
    assert_match(/\Atinyci-raytracer-main-\d+\z/, name)
    assert name.length <= 63, "name #{name.inspect} exceeds DNS-1123 limit"
  end

  test "labels include build / project / plan for runner watch" do
    labels = manifest[:metadata][:labels]
    assert_equal @build.id.to_s, labels["tiny-ci/build-id"]
    assert_equal "raytracer",    labels["tiny-ci/project"]
    assert_equal "main",         labels["tiny-ci/plan"]
  end

  test "ttlSecondsAfterFinished defaults to 1 hour" do
    assert_equal 3600, manifest[:spec][:ttlSecondsAfterFinished]
  end

  test "ttlSecondsAfterFinished is overridable via env" do
    ENV["TINY_CI_RUNNER_TTL_SECONDS"] = "600"
    assert_equal 600, manifest[:spec][:ttlSecondsAfterFinished]
  end

  test "backoffLimit is 0 — build framework owns retries" do
    assert_equal 0, manifest[:spec][:backoffLimit]
  end

  test "init container clones the repo at build.revision" do
    init = manifest[:spec][:template][:spec][:initContainers].first
    assert_equal "git-clone", init[:name]
    script = init[:command].last
    assert_includes script, "https://github.com/example/raytracer.git"
    assert_includes script, "deadbeef" * 5
    assert_match(/git fetch --depth=1 origin/, script)
  end

  test "build container runs Plan.steps as the script" do
    container = manifest[:spec][:template][:spec][:containers].first
    assert_equal "build", container[:name]
    assert_equal "bundle exec rake test", container[:command].last
    assert_equal "/workspace", container[:workingDir]
  end

  test "build container falls back to a hard error when steps are blank" do
    @plan.update!(steps: "")
    script = manifest[:spec][:template][:spec][:containers].first[:command].last
    assert_match(/no build steps configured/, script)
    assert_match(/exit 1/, script)
  end

  test "build container default image is ruby:3.2.3-slim" do
    image = manifest[:spec][:template][:spec][:containers].first[:image]
    assert_equal "ruby:3.2.3-slim", image
  end

  test "build container image is overridable" do
    ENV["TINY_CI_RUNNER_IMAGE"] = "node:20-alpine"
    assert_equal "node:20-alpine", manifest[:spec][:template][:spec][:containers].first[:image]
  end

  test "init + main share an emptyDir workspace" do
    spec = manifest[:spec][:template][:spec]
    assert_equal [{ name: "workspace", emptyDir: {} }], spec[:volumes]
    spec[:initContainers].first[:volumeMounts].each { |m| assert_equal "/workspace", m[:mountPath] }
    spec[:containers].first[:volumeMounts].each     { |m| assert_equal "/workspace", m[:mountPath] }
  end

  test "build env carries through branch/sha/pr metadata from parameters" do
    @build.update!(parameters: { "branch" => "topic", "sha" => "abc", "event" => "push", "pr_number" => 42 })
    env = manifest[:spec][:template][:spec][:containers].first[:env]
    assert_includes env, { name: "branch", value: "topic" }
    assert_includes env, { name: "event",  value: "push" }
    assert_includes env, { name: "pr_number", value: "42" }
  end

  test "resource defaults are conservative" do
    res = manifest[:spec][:template][:spec][:containers].first[:resources]
    assert_equal "100m",  res[:requests][:cpu]
    assert_equal "256Mi", res[:requests][:memory]
    assert_equal "1",     res[:limits][:cpu]
    assert_equal "1Gi",   res[:limits][:memory]
  end

  test "resources read overrides from build.needed_resources" do
    @build.stubs(:needed_resources).returns(cpu: "500m", memory: "1Gi", cpu_limit: "2", memory_limit: "4Gi")
    res = manifest[:spec][:template][:spec][:containers].first[:resources]
    assert_equal "500m", res[:requests][:cpu]
    assert_equal "1Gi",  res[:requests][:memory]
    assert_equal "2",    res[:limits][:cpu]
    assert_equal "4Gi",  res[:limits][:memory]
  end

  test "shell-escapes repository_url to defend against weird chars" do
    @plan.update!(repository_url: "https://example.com/repo.git; rm -rf /")
    script = manifest[:spec][:template][:spec][:initContainers].first[:command].last
    assert_includes script, "'https://example.com/repo.git; rm -rf /'"
  end
end
