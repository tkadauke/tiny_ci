module TinyCI
  # GitHub App integration: bearer-JWT auth, installation-token mint and
  # cache, and the Checks API reporter that wires Build state changes
  # back to GitHub commit/PR status.
  #
  # All operations are no-ops unless GITHUB_APP_ID + GITHUB_APP_PRIVATE_KEY
  # are configured AND the project has a github_installation_id +
  # github_repo_full_name. That keeps dev/test boots free of GitHub
  # dependencies and lets a project opt out by leaving the columns blank.
  module GitHub
    def self.configured?
      App.app_id.present? && App.private_key_pem.present?
    end
  end
end
