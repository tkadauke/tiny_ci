ENV["RAILS_ENV"] ||= "test"

require "simplecov"
SimpleCov.start "rails" do
  add_group "TinyCI Domain", "app/lib/tiny_ci"
  minimum_coverage 0
end

require_relative "../config/environment"
require "rails/test_help"
require "mocha/minitest"

class ActiveSupport::TestCase
  parallelize(workers: 1)
  # Fixtures are opt-in; tests that want them call `fixtures :name`.
end
