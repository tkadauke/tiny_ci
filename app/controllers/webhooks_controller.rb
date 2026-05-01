# POST /webhooks/github/:project_id — GitHub webhook receiver.
#
# Verifies X-Hub-Signature-256 against the project's webhook_secret
# (per-project so noisy/leaky secrets don't take down the whole server).
# Then matches plans by repository_url within the project, and creates a
# pending Build per matching plan with the event SHA. Build creation fans
# out to the scheduler via Build#after_create_commit -> BuildJob.
#
# Auth is HMAC only — the route is intentionally outside session/CSRF
# (ActionController::API) so the GitHub static delivery config works
# without cookies. Network-level access control (TLS, ingress) is the
# deployment's responsibility.
class WebhooksController < ActionController::API
  before_action :load_project
  before_action :verify_signature

  def github
    return head :ok unless @project.webhooks_enabled

    case request.headers["X-GitHub-Event"]
    when "ping"          then head :ok
    when "push"          then handle_push
    when "pull_request"  then handle_pull_request
    else                       head :ok
    end
  end

  private

  def load_project
    @project = Project.find_by(name: params[:project_id])
    head :not_found unless @project
  end

  # Reject early on missing/blank/mismatched signature. Constant-time
  # compare so timing doesn't leak the expected digest.
  def verify_signature
    secret    = @project&.webhook_secret
    signature = request.headers["X-Hub-Signature-256"].to_s
    return head :unauthorized if secret.blank? || signature.blank?

    expected = "sha256=" + OpenSSL::HMAC.hexdigest("SHA256", secret, request.raw_post)
    head :unauthorized unless ActiveSupport::SecurityUtils.secure_compare(expected, signature)
  end

  def handle_push
    payload = parsed_payload
    sha     = payload["after"].to_s
    return head :ok if sha.blank? || sha == "0" * 40 # branch deletion

    branch = payload["ref"].to_s.sub(%r{\Arefs/heads/}, "")
    enqueue(
      repo_urls: repo_urls_from(payload["repository"]),
      sha:       sha,
      event:     "push",
      branch:    branch
    )
  end

  def handle_pull_request
    payload = parsed_payload
    return head :ok unless %w[opened synchronize reopened].include?(payload["action"])

    pr  = payload["pull_request"] || {}
    sha = pr.dig("head", "sha").to_s
    return head :ok if sha.blank?

    enqueue(
      repo_urls: repo_urls_from(payload["repository"]),
      sha:       sha,
      event:     "pull_request",
      branch:    pr.dig("head", "ref"),
      pr_number: pr["number"]
    )
  end

  # Match plans on any of the URL aliases GitHub publishes (https/ssh/git).
  # Slice 1 matches by exact equality; trailing slashes / .git suffix
  # normalization is a follow-up.
  def repo_urls_from(repo)
    return [] unless repo.is_a?(Hash)
    [repo["clone_url"], repo["ssh_url"], repo["git_url"], repo["html_url"]].compact.uniq
  end

  def enqueue(repo_urls:, sha:, event:, **extra)
    return head :ok if duplicate?(sha: sha, event: event)

    plans = @project.plans.where(repository_url: repo_urls)
    parameters = { "event" => event, "sha" => sha }.merge(extra.compact.transform_keys(&:to_s))
    plans.each { |plan| plan.build!(revision: sha, parameters: parameters) }
    head :ok
  end

  # Dedupe by (project, event, sha) within a short window so GitHub's
  # at-least-once delivery semantics don't double-build. Five minutes
  # comfortably covers the retry envelope.
  def duplicate?(sha:, event:)
    key = "webhook:github:#{@project.id}:#{event}:#{sha}"
    if Rails.cache.exist?(key)
      true
    else
      Rails.cache.write(key, true, expires_in: 5.minutes)
      false
    end
  end

  def parsed_payload
    @parsed_payload ||= begin
      raw = request.raw_post
      raw.present? ? JSON.parse(raw) : {}
    rescue JSON::ParserError
      {}
    end
  end
end
