# GET /metrics — Prometheus text-format scrape endpoint.
#
# Each scrape queries the DB at request time. Queries are deliberately
# cheap (counts only) so a tight scrape interval is fine. The Prometheus
# scrape default (15s) sets the practical floor on how often this runs.
#
# Auth is handled at the network layer (k8s NetworkPolicy / scrape-only
# Service) — that's the standard Prometheus pattern, and gating with
# Devise-style sessions interferes with the scraper's static config.
#
# Histograms / per-build duration metrics need either an ActiveRecord
# callback that observes on transition to finished, or a process-level
# observation cache — both are deliberately a follow-up. This slice only
# ships gauges so it can land without infra changes.
class MetricsController < ActionController::API
  REGISTRY = Prometheus::Client::Registry.new

  PENDING_BUILDS = REGISTRY.gauge(
    :tiny_ci_pending_builds,
    docstring: "Number of builds currently in 'pending' state."
  )
  RUNNING_BUILDS = REGISTRY.gauge(
    :tiny_ci_running_builds,
    docstring: "Number of builds currently in 'running' state."
  )
  TOTAL_SLAVES = REGISTRY.gauge(
    :tiny_ci_slaves_total,
    docstring: "Total configured slaves, online or offline."
  )
  ONLINE_SLAVES = REGISTRY.gauge(
    :tiny_ci_slaves_online,
    docstring: "Slaves not marked offline."
  )

  def index
    PENDING_BUILDS.set(Build.where(status: "pending").count)
    RUNNING_BUILDS.set(Build.where(status: "running").count)
    TOTAL_SLAVES.set(Slave.count)
    ONLINE_SLAVES.set(Slave.where(offline: [false, nil]).count)

    response.headers["Content-Type"] = Prometheus::Client::Formats::Text::CONTENT_TYPE
    render plain: Prometheus::Client::Formats::Text.marshal(REGISTRY)
  end
end
