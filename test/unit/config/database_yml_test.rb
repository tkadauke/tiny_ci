require_relative "../../test_helper"

class DatabaseYmlTest < ActiveSupport::TestCase
  PATH = Rails.root.join("config/database.yml").freeze

  test "should ship config/database.yml in the repo" do
    assert File.exist?(PATH), "config/database.yml is missing — the repo must ship a database template so a fresh clone can run bin/rails db:test:prepare"
  end

  test "should define development, test, and production environments" do
    parsed = YAML.unsafe_load(ERB.new(File.read(PATH)).result)
    %w[development test production].each do |env|
      assert parsed.key?(env), "config/database.yml is missing an entry for #{env}"
      assert parsed[env]["adapter"], "config/database.yml is missing an adapter for #{env}"
    end
  end
end
