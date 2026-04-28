require_relative "../test_helper"

class SlaveTest < ActiveSupport::TestCase
  test "should validate" do
    assert_not Slave.new.valid?
    assert_not Slave.new(name: "some_name").valid?
    assert_not Slave.new(protocol: "ssh").valid?
    assert     Slave.new(name: "some_name", protocol: "ssh").valid?
  end

  test "should clone slave" do
    original = Slave.new(name: "some_name", protocol: "ssh", username: "johndoe", password: "drowssap")
    Slave.expects(:find_by!).with(name: "some_name").returns(original)

    clone = Slave.find_for_cloning!("some_name")
    assert_nil clone.name
    assert_equal original.protocol, clone.protocol
    assert_equal original.username, clone.username
    assert_equal original.password, clone.password

    assert clone.new_record?
  end

  test "should use the global environment as fallback for the current environment" do
    slave = Slave.new(environment_variables: { 1 => { "key" => "foo", "value" => "bar" } })
    TinyCI::Config.stubs(environment: { "foo" => "baz", "hello" => "world" })

    assert_equal({ "foo" => "bar", "hello" => "world" }, slave.current_environment)
  end

  test "should figure out if slave is busy" do
    slave = Slave.new
    slave.expects(:running_builds).returns([stub])
    assert slave.busy?
  end

  test "should figure out if slave is free" do
    slave = Slave.new
    slave.expects(:running_builds).returns([])
    assert slave.free?
  end

  # The slave-matching tests depend on TinyCI::Resources::Parser which is a
  # stub in app/lib/tiny_ci/resources.rb pending the scheduler port.
  %w[
    should_find_least_busy_slave_for_build
    should_find_no_slave_for_build_if_requirements_are_too_high
    should_find_no_slave_for_build_if_unnumbered_requirements_is_not_met
    should_find_slave_if_max_number_of_builds_is_not_exceeded
    should_not_find_slave_if_every_slaves_max_number_of_builds_is_exceeded
    should_find_least_busy_slave_for_build_even_if_another_build_is_running
    should_not_find_a_slave_for_build_if_there_are_too_many_resources_reserved
  ].each do |name|
    test name.tr("_", " ") do
      skip "Slave#can_build_now? depends on unported TinyCI::Resources::Parser"
    end
  end

  test "should clean up environment before save" do
    slave = Slave.new(environment_variables: {
      1 => { "key" => "foo", "value" => "bar" },
      2 => { "key" => nil, "value" => nil }
    })
    slave.send(:cleanup_environment)
    assert_equal({ 1 => { "key" => "foo", "value" => "bar" } }, slave.environment_variables)
  end

  test "should use name as param" do
    assert_equal "some_slave", Slave.new(name: "some_slave").to_param
  end

  test "should find slave by name" do
    Slave.expects(:find_by!).with(name: "some_plan")
    Slave.from_param!("some_plan")
  end
end
