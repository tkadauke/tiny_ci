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

gem "acts_as_list", "~> 1.2"
gem "acts_as_tree", "~> 2.9"

gem "turbo-rails"
gem "vite_rails"
gem "propshaft"

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
