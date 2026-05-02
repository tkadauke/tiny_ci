# Production process model.
#
# Used by foreman-style supervisors (foreman, overmind, hivemind) and by
# PaaS that consume Procfile (Heroku, Dokku, Render). Inside k8s the chart
# launches each process as its own Deployment instead.
#
# bin/dev + Procfile.dev is the development equivalent.

web:       bundle exec rails server -b 0.0.0.0 -p ${PORT:-7199}
scheduler: bundle exec rake tiny_ci:scheduler
