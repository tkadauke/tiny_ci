# Single-line structured request logs.
#
# Enabled in production by default so logs aggregate cleanly into a
# stdout-shipped pipeline (lograge collapses Rails' 4-line per-request
# output into one). Multi-line default stays on in dev/test where the
# extra detail is more readable than parseable.
#
# Override in any env with LOGRAGE_ENABLED=true|false.

Rails.application.configure do
  enabled = ENV.fetch("LOGRAGE_ENABLED", Rails.env.production?.to_s) == "true"

  config.lograge.enabled = enabled
  next unless enabled

  # JSON over key=value — matches the rest of the operational toolchain
  # we expect (Loki / Vector / a flat `jq` filter).
  config.lograge.formatter = Lograge::Formatters::Json.new

  # Surface request_id + remote_ip + user_id, populated by the
  # `append_info_to_payload` override in ApplicationController. params is
  # deliberately not included — query strings can carry secrets that would
  # otherwise land in the logs unfiltered.
  config.lograge.custom_options = lambda do |event|
    {
      time: event.time.utc.iso8601(3),
      remote_ip: event.payload[:remote_ip],
      request_id: event.payload[:request_id],
      user_id: event.payload[:user_id]
    }.compact
  end
end
