source "https://rubygems.org"

ruby "3.2.3"

gem "rails", "~> 8.1.3"
gem "trilogy"
gem "sqlite3", "~> 2.9"
gem "puma"
gem "bootsnap", require: false
gem "tzinfo-data", platforms: %i[mingw mswin x64_mingw jruby]

gem "bcrypt"
gem "net-ssh"
gem "RedCloth"
gem "csv"

gem "acts_as_list"
gem "acts_as_tree"

gem "turbo-rails"
gem "importmap-rails"
gem "propshaft"

# GitHub App auth + Checks API for status reporting (#84). Octokit
# handles REST + retries; jwt mints the App-level bearer that we exchange
# for an installation token. Both no-op until GITHUB_APP_ID +
# GITHUB_APP_PRIVATE_KEY are set, so dev/test boots without GitHub.
gem "octokit", "~> 9.0"
gem "jwt",     "~> 2.8"

group :development do
  gem "web-console"
  gem "listen"
  gem "foreman", require: false
end

group :development, :test do
  gem "debug", platforms: %i[mri windows]
  gem "bundler-audit", require: false
end

group :test do
  gem "mocha"
  gem "simplecov", require: false
end
