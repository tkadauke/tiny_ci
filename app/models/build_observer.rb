# Rails 5+ removed observers. The lifecycle hooks live on Build directly via
# `after_create_commit` / `after_update_commit`. Keeping this file as a stub so
# legacy references (e.g. config.active_record.observers) don't blow up; it is
# not registered anywhere.
class BuildObserver
end
