require_relative "../test_helper"

class ShellLocalhostIntegrationTest < ActiveSupport::TestCase
  setup do
    @build = Build.new
    @build.stubs(current_environment: {})
    @localhost = TinyCI::Shell::Localhost.new(@build)
  end

  test "exists? recognises an existing directory" do
    assert @localhost.exists?(File.dirname(__FILE__), Rails.root.to_s)
  end

  test "exists? recognises an existing file" do
    assert @localhost.exists?("shell_localhost_integration_test.rb", File.dirname(__FILE__))
  end

  test "capture returns stdout of the command" do
    assert_match(/shell_localhost_integration_test\.rb/, @localhost.capture("ls", File.dirname(__FILE__)))
  end
end
