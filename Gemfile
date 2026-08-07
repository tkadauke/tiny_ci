source "https://rubygems.org"

ruby "3.4.10"

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
gem "vite_rails"
gem "propshaft"

# Single-line structured request logs in production. Default multi-line Rails
# format stays in dev/test where readability beats parseability.
gem "lograge"

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
