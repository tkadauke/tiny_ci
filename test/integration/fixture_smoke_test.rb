require_relative "../test_helper"

# This smoke test verifies that the YAML fixtures under test/fixtures/ are
# valid and load cleanly. It deliberately does NOT use the standard
# `fixtures :name` declaration: that mechanism inserts fixture rows
# OUTSIDE the per-test transaction, leaving them committed to the test
# database for the entire run. TinyCI's Guest model treats an empty
# `users` table as the first-run signal that grants the anonymous session
# admin permissions, so a single user fixture would silently break every
# controller test that builds users inline.
#
# Instead we read each YAML file directly, build records inline, and let
# the per-test transactional rollback clean up after us. This validates
# that opt-in callers can require these fixtures via `fixtures :users,
# :projects, :plans, :slaves, :builds` in their own test classes without
# relying on this file having loaded them.
class FixtureSmokeTest < ActiveSupport::TestCase
  FIXTURE_DIR = Rails.root.join("test/fixtures").freeze

  def parse(name)
    yaml = ERB.new(File.read(FIXTURE_DIR.join("#{name}.yml"))).result
    YAML.safe_load(yaml, permitted_classes: [Date, Time], aliases: true)
  end

  test "should load users fixture YAML into valid records with roles" do
    parsed = parse("users")
    expected_logins = %w[fixture_admin fixture_manager fixture_user fixture_guest_login]
    assert_equal expected_logins.sort, parsed.values.map { |row| row["login"] }.sort

    parsed.each_value do |attrs|
      user = User.new(attrs)
      assert user.valid?, "fixture user #{attrs["login"]} not valid: #{user.errors.full_messages.inspect}"
    end

    admin = User.new(parsed["admin"])
    assert admin.is_a?(Role::Admin)
    assert admin.authenticate("password")

    regular = User.new(parsed["regular_user"])
    assert regular.is_a?(Role::User)

    guest_login = User.new(parsed["guest_login_user"])
    assert_equal "fixture_guest_login", guest_login.login
  end

  test "should load projects fixture YAML into a valid record" do
    parsed = parse("projects")
    project = Project.new(parsed["rails_project"])
    assert_equal "fixture_rails_project", project.name
    assert project.valid?
  end

  test "should load plans fixture YAML into valid master and child records" do
    parsed_projects = parse("projects")
    parsed_plans = parse("plans")
    project = Project.create!(parsed_projects["rails_project"])

    master = Plan.create!(parsed_plans["master"].except("project").merge(project: project))
    assert_equal "fixture_master_plan", master.name
    assert master.valid?
    assert master.standalone?

    child = Plan.create!(parsed_plans["child"].except("project", "parent").merge(project: project, parent: master))
    assert_equal "fixture_child_plan", child.name
    assert_equal master, child.parent
    assert child.valid?
    assert_not child.standalone?
  end

  test "should load slaves fixture YAML into a valid record" do
    parsed = parse("slaves")
    slave = Slave.new(parsed["fixture_slave"])
    assert_equal "fixture_slave", slave.name
    assert_equal "localhost", slave.protocol
    assert slave.valid?
    assert slave.free?
  end

  test "should load builds fixture YAML into valid records" do
    parsed_projects = parse("projects")
    parsed_plans = parse("plans")
    parsed_slaves = parse("slaves")
    project = Project.create!(parsed_projects["rails_project"])
    master = Plan.create!(parsed_plans["master"].except("project").merge(project: project))
    slave = Slave.create!(parsed_slaves["fixture_slave"])

    parsed = parse("builds")
    %w[recent_success recent_failure pending].each do |key|
      assert parsed.key?(key), "expected fixture builds.yml to define #{key}"
    end

    success_attrs = parsed["recent_success"].except("plan", "slave")
    success = master.builds.build(success_attrs.merge(slave: slave))
    assert success.valid?, success.errors.full_messages.inspect
    assert_equal "success", success.status

    failure_attrs = parsed["recent_failure"].except("plan", "slave")
    failure = master.builds.build(failure_attrs.merge(slave: slave))
    assert failure.valid?
    assert_equal "failure", failure.status

    pending_attrs = parsed["pending"].except("plan", "slave")
    pending = master.builds.build(pending_attrs.merge(slave: slave))
    assert pending.valid?
    assert_equal "pending", pending.status
  end
end
