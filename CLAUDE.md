# CLAUDE.md

This file provides guidance to Claude Code (and similar coding agents) when working in this repository.

## Project Overview

TinyCI is a continuous integration server written as a Ruby on Rails 2.3 application. It schedules and runs builds across local and remote build slaves, supports chained and parallel (child) builds, and exposes a web UI on port 7199 with real-time updates via Juggernaut. While intended primarily for Rails projects using Git and Test::Unit, builds can be configured for any language. Functionality is extensible through plugins (builders, notifiers, SCM, deployers) located under `modules/`.

## Tech Stack

- Ruby on Rails 2.3.16
- MySQL (via the `mysql` gem)
- Authlogic for authentication
- Juggernaut 0.5.8 for real-time page updates
- net-ssh for remote build slave communication
- RedCloth, fastercsv
- Test::Unit (unit/functional), RSpec 1.3, Cucumber + Webrat (features), Mocha
- Bundler / Gemfile

## Repository Structure

- `app/` - Standard Rails MVC: `controllers/`, `models/`, `views/`, `helpers/`. Notable models: `build.rb`, `plan.rb`, `project.rb`, `slave.rb`, `user.rb`, `build_observer.rb`.
- `config/` - Rails environment, routes, locales (English + German), initializers, `version.rb` (`TINY_CI_VERSION`), `background.yml`, `options.yml`.
- `db/` - Migrations and schema.
- `lib/tiny_ci/` - Core CI logic outside of Rails MVC: `scheduler/`, `background_queue.rb`, `dsl.rb`, `config.rb`, `output.rb`, `output_parser/`, `report/`, `shell.rb`, `source_control/`, `steps/`, `notifier/`, `setup/`.
- `modules/` - Plugin tree loaded by `modules/load_modules.rb`. Layout: `modules/<kind>/<name>/init.rb`. Existing kinds: `builders/rake`, `scm/git`, `notifiers/email`, `notifiers/growl`, `deployers/capistrano`.
- `script/` - Rails 2 scripts plus TinyCI-specific entry points: `tiny_ci`, `scheduler`, `builder`, `daemon`, `background`, `cucumber`.
- `test/` - `unit/`, `functional/`, `performance/`, plus `test_helper.rb`.
- `features/` - Cucumber feature files and step definitions.
- `vendor/`, `public/`, `doc/`, `log/`, `tmp/` - Standard Rails dirs.

## Common Commands

Setup (installs bundled gems):

    rake setup            # or: sudo rake setup when cloning from source

Run server (production):

    RAILS_ENV=production rake start    # starts daemon on port 7199
    rake stop
    RAILS_ENV=production rake restart

Development run (all required processes, foreground):

    script/tiny_ci

Tests:

    rake                  # unit + functional tests
    rake test:modules     # runs `rake test` in each modules/*/*/ that has init.rb
    rake test:coverage    # rcov coverage into test/coverage
    rake cucumber:all     # feature tests (requires mocha, cucumber, webrat, rspec, rspec-rails)

Distribution:

    rake dist
    rake distclean

## Architecture & Conventions

- Three runtime processes when idle: the Rails web server, the scheduler (spawns and supervises build processes), and a Juggernaut server pushing live UI updates.
- The scheduler does not reload classes between requests; the Rails server does. Restart everything (Ctrl-C in `script/tiny_ci`) when changing scheduler-side code.
- `config.active_record.observers = :build_observer` wires `app/models/build_observer.rb` for build lifecycle side effects.
- Plugins are auto-loaded by `modules/load_modules.rb`, which globs `modules/*/*/init.rb`. New builders, SCMs, notifiers, or deployers go in their respective subdirectory and supply an `init.rb`.
- Build configuration is expressed via the DSL in `lib/tiny_ci/dsl.rb`; output parsing and reporting live under `lib/tiny_ci/output_parser/` and `lib/tiny_ci/report/`.
- Locales: i18n files under `config/locales/` (English and German). `i18n_tools` is used in development.
- A `SETUP=true` environment variable short-circuits initialization (skips ActiveRecord/observers) so `rake setup` can run before the database exists.

## Testing

- Unit and functional tests use Test::Unit with Mocha; default `rake` target runs them.
- Module tests are run from each module directory via `rake test:modules`.
- Acceptance tests use Cucumber + Webrat under `features/`; run `rake cucumber:all`.
- Test helpers: `test/test_helper.rb`, `test/unit/test_helper.rb`, `test/functional/test_helper.rb`.

## Notes / Gotchas

- This is Rails 2.3, not modern Rails. Patterns differ from Rails 5+: `config/environment.rb` style boot, `script/*` rather than `bin/*`, `Rails::Initializer.run`, `RAILS_ROOT`, observers, etc. Do not introduce Rails 3+ idioms unintentionally.
- Gem versions in `Gemfile` are pinned to old releases (Rails 2.3.16, authlogic 2.1.3, rspec 1.3.0, cucumber-rails 0.3.0). Avoid bumping casually.
- Default port is 7199.
- Several test gems (mocha, cucumber, webrat, rspec, rspec-rails) are required for tests but not part of the self-contained distribution; install via Bundler/`rake setup`.
- `source :rubygems` in the Gemfile is legacy syntax; modern Bundler may warn.
- Internet Explorer is explicitly unsupported (per README).
