# Sentry error tracking.
#
# DSN-gated: if SENTRY_DSN is empty (typical for local dev / CI / test) the
# SDK is initialized but reports nothing — calling Sentry.capture_exception
# in code that runs outside production is a no-op rather than a crash.
#
# In production the DSN comes from the same secret the chart points
# server.envFromSecretName at.

return if ENV["SENTRY_DSN"].to_s.strip.empty?

Sentry.init do |config|
  config.dsn = ENV["SENTRY_DSN"]
  config.environment = ENV.fetch("SENTRY_ENVIRONMENT", Rails.env)
  config.release = ENV["SENTRY_RELEASE"] || (defined?(TINY_CI_VERSION) ? TINY_CI_VERSION : nil)

  # Performance monitoring is off by default to keep volume (and bill)
  # predictable. Bump SENTRY_TRACES_SAMPLE_RATE=0.1 in env to start
  # sampling once we want traces.
  config.traces_sample_rate = ENV.fetch("SENTRY_TRACES_SAMPLE_RATE", "0.0").to_f

  # 404s and routing errors are noise — the only signal in them is that
  # someone hit a wrong URL. Drop before they hit the wire.
  config.excluded_exceptions += %w[
    ActionController::RoutingError
    ActiveRecord::RecordNotFound
    ActionController::InvalidAuthenticityToken
  ]

  # Belt-and-braces redaction for the few request bits Sentry attaches
  # automatically. The Rails parameter filter (filter_parameters) handles
  # the body; this catches headers Rails doesn't filter.
  config.send_default_pii = false

  # Don't ship breadcrumbs that leak SQL with bound params. Logger
  # breadcrumbs alone are usually enough to reconstruct what happened.
  config.breadcrumbs_logger = [:active_support_logger]
end
