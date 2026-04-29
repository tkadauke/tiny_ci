require_relative "../test_helper"
require "fileutils"
require "tmpdir"

# End-to-end smoke test: configure a real Project + Plan + Slave, kick off
# the BuildJob synchronously, and verify the build runs through the full
# Shell → DSL → output pipeline. Catches integration bugs that the unit
# tests can't see (the layers in isolation pass; this confirms the seams
# between them).
class BuildLifecycleTest < ActiveSupport::TestCase
  setup do
    @tmpdir = Dir.mktmpdir("tiny_ci_lifecycle")
    @project = Project.create!(name: "demo")
    @plan = Plan.create!(
      project: @project,
      name: "main",
      steps: %(sh "echo hello world")
    )
    @slave = Slave.create!(
      name: "localhost",
      protocol: "localhost",
      base_path: @tmpdir
    )
    @build = @plan.builds.create!(status: "pending", slave: @slave)
    # Without a repository_url, the SCM step doesn't run and nothing creates
    # the workspace directory — pre-create it so `sh` has a working_dir.
    FileUtils.mkdir_p(File.join(@tmpdir, @project.name, @plan.name))
  end

  teardown do
    FileUtils.rm_rf(@tmpdir)
  end

  test "build runs end to end and ends in success" do
    BuildJob.perform_now(@build.id)
    @build.reload

    assert_equal "success", @build.status, "build status was #{@build.status.inspect}: output=#{@build.output.inspect}"
    assert_not_nil @build.finished_at
    assert_match(/hello world/, @build.output)
  end

  test "should persist runner output when an unexpected exception ends the build in error" do
    @plan.update!(steps: %(sh "echo hello"))
    error_build = @plan.builds.create!(status: "pending", slave: @slave)
    TinyCI::DSL.stubs(:evaluate).raises(RuntimeError, "boom from the runner")

    BuildJob.perform_now(error_build.id)
    error_build.reload

    assert_equal "error", error_build.status
    assert_match(/boom from the runner/, error_build.output, "expected exception message in output: #{error_build.output.inspect}")
  end

  test "should pass nil-valued env vars through without crashing the shell" do
    @plan.update!(steps: <<~RUBY)
      env "BUNDLE_GEMFILE" => nil, "BUNDLER_VERSION" => nil
      sh "echo nil-env-ok"
    RUBY
    nil_env_build = @plan.builds.create!(status: "pending", slave: @slave)

    BuildJob.perform_now(nil_env_build.id)
    nil_env_build.reload

    assert_equal "success", nil_env_build.status, "output=#{nil_env_build.output.inspect}"
    assert_match(/nil-env-ok/, nil_env_build.output)
  end

  test "build fails when shell step exits non-zero" do
    @plan.update!(steps: %(sh "false"))
    failing = @plan.builds.create!(status: "pending", slave: @slave)

    BuildJob.perform_now(failing.id)
    failing.reload

    assert_equal "failure", failing.status, "expected failure, got #{failing.status.inspect}"
    assert_not_nil failing.finished_at
  end

  test "build with multiple steps runs them in order" do
    @plan.update!(steps: <<~RUBY)
      sh "echo first"
      sh "echo second"
      sh "echo third"
    RUBY
    multi = @plan.builds.create!(status: "pending", slave: @slave)

    BuildJob.perform_now(multi.id)
    multi.reload

    assert_equal "success", multi.status, "output=#{multi.output.inspect}"
    assert_match(/first/, multi.output)
    assert_match(/second/, multi.output)
    assert_match(/third/, multi.output)
    # Ensure ordering — `first` should appear before `second` in the CSV
    assert multi.output.index("first") < multi.output.index("second")
    assert multi.output.index("second") < multi.output.index("third")
  end

  test "build with cd block scopes the working directory" do
    FileUtils.mkdir_p(File.join(@tmpdir, @project.name, @plan.name, "subdir"))
    File.write(File.join(@tmpdir, @project.name, @plan.name, "subdir", "marker.txt"), "marker contents\n")

    @plan.update!(steps: <<~RUBY)
      cd "subdir" do
        sh "cat marker.txt"
      end
    RUBY
    cd_build = @plan.builds.create!(status: "pending", slave: @slave)

    BuildJob.perform_now(cd_build.id)
    cd_build.reload

    assert_equal "success", cd_build.status, "output=#{cd_build.output.inspect}"
    assert_match(/marker contents/, cd_build.output)
  end
end
