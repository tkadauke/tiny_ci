require "jwt"
require "octokit"

module TinyCI
  module GitHub
    # GitHub App auth: mints a 10-minute bearer JWT signed with the App's
    # private key, then exchanges it for a per-installation OAuth token
    # that's cached until ~5 minutes before its hour-long expiry.
    #
    # Per the GitHub docs, installation tokens are valid for 60 minutes.
    # We cache for 55 minutes so refresh happens in-band without races
    # against API calls that spend a few seconds.
    class App
      JWT_TTL_SECONDS    = 9 * 60   # GitHub allows 10; leave headroom for clock drift.
      TOKEN_CACHE_WINDOW = 55 * 60  # Installation tokens last 60m; refresh at 55m.

      class << self
        def app_id
          ENV["GITHUB_APP_ID"].presence
        end

        # Accept the PEM directly or a path to a PEM file. Direct PEM is
        # what the Sealed Secret will mount (see #84 deps).
        def private_key_pem
          if (path = ENV["GITHUB_APP_PRIVATE_KEY_PATH"]).present? && File.exist?(path)
            File.read(path)
          else
            ENV["GITHUB_APP_PRIVATE_KEY"].presence
          end
        end

        # Octokit client authenticated as the App itself (used to mint
        # installation tokens; not for repo-level calls).
        def jwt_client
          Octokit::Client.new(bearer_token: bearer_jwt)
        end

        # Octokit client authenticated as a specific installation.
        # Token is cached in Rails.cache; first call per process per
        # installation does the network round-trip.
        def installation_client(installation_id)
          token = installation_token(installation_id)
          Octokit::Client.new(access_token: token)
        end

        def installation_token(installation_id)
          cache_key = "tiny_ci:github:installation_token:#{installation_id}"
          Rails.cache.fetch(cache_key, expires_in: TOKEN_CACHE_WINDOW) do
            jwt_client.create_app_installation_access_token(installation_id).token
          end
        end

        private

        # GitHub requires `iat` slightly in the past (clock drift) and
        # an `exp` no more than 10 minutes ahead.
        def bearer_jwt
          now = Time.now.to_i
          payload = { iat: now - 30, exp: now + JWT_TTL_SECONDS, iss: app_id }
          key = OpenSSL::PKey::RSA.new(private_key_pem)
          JWT.encode(payload, key, "RS256")
        end
      end
    end
  end
end
