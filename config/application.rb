require_relative "boot"

require "rails"
require "active_model/railtie"
require "active_record/railtie"
require "active_job/railtie"
require "action_controller/railtie"
require "action_view/railtie"
require "action_mailer/railtie"
require "action_cable/engine"
require "rails/test_unit/railtie"

Bundler.require(*Rails.groups)

require_relative "version"

module TinyCI
  class Application < Rails::Application
    config.load_defaults 7.2

    config.time_zone = "UTC"
    config.i18n.available_locales = [:en, :de]
    config.i18n.default_locale = :en
  end
end
