require "active_support/core_ext/integer/time"

Rails.application.configure do
  config.cache_classes = true
  config.eager_load = true

  config.consider_all_requests_local = false
  config.action_controller.perform_caching = true

  config.public_file_server.enabled = ENV["RAILS_SERVE_STATIC_FILES"].present?

  # Force HTTPS in production. Disable via DISABLE_FORCE_SSL=1 for behind-the-LB
  # deploys where TLS terminates upstream and the Rack request scheme doesn't
  # reflect the client.
  config.force_ssl = !ENV["DISABLE_FORCE_SSL"].present?

  config.log_level = ENV.fetch("RAILS_LOG_LEVEL", "info").to_sym
  config.log_tags = [:request_id]
  config.logger = ActiveSupport::TaggedLogging.new(Logger.new($stdout))

  config.cache_store = :memory_store

  config.i18n.fallbacks = true

  config.active_support.report_deprecations = false

  config.action_mailer.raise_delivery_errors = false
  config.action_mailer.perform_caching = false

  config.active_record.dump_schema_after_migration = false
end
