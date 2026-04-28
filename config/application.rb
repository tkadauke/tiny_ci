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

    # `lib/` holds the legacy TinyCI scheduler/builder/runner code that is not
    # yet ported to modern Rails. We deliberately keep it OUT of the autoload
    # paths so Zeitwerk does not try to load it during boot. Files that need
    # to use it should `require_relative "../../lib/tiny_ci/..."` explicitly.

    config.time_zone = "UTC"
    config.i18n.available_locales = [:en, :de]
    config.i18n.default_locale = :en

    # Modules/plugins from the Rails 2 era are not loaded by the modern boot.
    # See lib/tiny_ci/scheduler/* and modules/load_modules.rb — to be ported.
  end
end
