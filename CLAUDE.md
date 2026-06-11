# CLAUDE.md

This file provides guidance to Claude Code (and similar coding agents) when working in this repository.

## Project Overview

TinyCI is a continuous integration server. It schedules and runs builds across local and remote build slaves, supports chained and parallel (child) builds, and exposes a web UI on port 7199. While intended primarily for Rails projects using Git and Test::Unit, builds can be configured for any language. New build steps, SCMs, and notifiers are plain classes under `app/lib/tiny_ci/` plus a method on `TinyCI::DSL`.

The repo was migrated from Rails 2.3 to Rails 7.2 in early 2026 (see git log + `docs/modernize.md`). When in doubt about a pattern, copy what the rest of the modern code does — do not reach for Rails 2 idioms.

## Tech Stack

- Ruby 3.2.3 (`.ruby-version`)
- Rails 7.2 (`config.load_defaults 7.2`)
- Trilogy / MySQL in production, SQLite in dev/test
- `has_secure_password` for authentication (no Authlogic)
- ActiveJob (default `:async` adapter) for the build scheduler
- net-ssh for remote build slave communication
- Test::Unit + Mocha for unit/functional tests; legacy Cucumber `.feature` files under `features/` are kept as a behavior spec for the eventual Capybara/Cuprite system-test port (§3.3 of the roadmap) but do not run today
- RedCloth for help-topic rendering

## Repository Structure

- `app/` - Standard Rails MVC.
  - `app/jobs/build_job.rb` runs a single build.
  - `app/lib/tiny_ci/` holds the CI domain code: `scheduler.rb`, `dsl.rb`, `shell/`, `source_control/`, `steps/`, `notifier/`, `output.rb`, `output_parser/`, `report/`, `setup/`, `resources.rb`, `config.rb`, `base_config.rb`, `util/`. Zeitwerk-autoloaded.
  - `app/lib/juggernaut.rb` is a no-op stub kept so legacy view helpers still resolve until Action Cable / Hotwire replaces them.
  - `app/views/build_reports/{details,gist}/` holds the report partials rendered by `BuildsHelper#render_report`.
  - `app/mailers/build_mailer.rb` + `app/views/build_mailer/` for the email notifier.
- `config/` - Rails config. `application.rb`, `routes.rb`, `database.yml`, `puma.rb`, `locales/` (en + de), `initializers/`, `version.rb` (`TINY_CI_VERSION`), `options.yml` and `user_options.yml` consumed by `TinyCI::Config`/`TinyCI::BaseConfig`. `templates/` are ERB-rendered into `config/` by the first-run setup wizard.
- `db/` - `schema.rb` is the source of truth for fresh installs (`bin/rails db:schema:load`). `db/migrate/` is empty; future schema changes go through new Rails 7 migrations from this clean baseline (the original Rails 2.3 migrations were removed in #60 — git history is the archive).
- `lib/tasks/` - Rake tasks, including `tiny_ci:scheduler` (foreground poller) and the legacy `setup` / `dist` / `configuration` tasks (some still need a Rails 7 audit).
- `bin/` - `rails`, `rake`, `setup`. The Rails 2 `script/*` tree is gone.
- `test/` - `unit/`, `functional/`, `integration/`, plus `test_helper.rb`. ~320 runs.
- `features/` - Legacy Cucumber feature files; not run today (see `features/README.md`).
- `public/`, `doc/`, `log/`, `tmp/`, `storage/` - Standard Rails dirs.

## Common Commands

```
bin/setup                              # install gems, prepare db
bin/dev                                # web + scheduler together (foreman + Procfile.dev)
bin/rails server -p 7199               # web tier on its own
bundle exec rake tiny_ci:scheduler     # build scheduler on its own
bin/rails test                         # full test suite
bin/rails zeitwerk:check               # eager-load every autoloaded file
```

`bin/dev` is the modern equivalent of the old `script/tiny_ci` foreground
orchestrator. It uses foreman + `Procfile.dev` to run web + scheduler in
parallel; the script auto-installs foreman on first run.

## Architecture & Conventions

- The scheduler is `TinyCI::Scheduler` (module, not Singleton). `Scheduler.tick` is one stateless pass — pick the next buildable Build, find a free Slave, enqueue a `BuildJob`. `Scheduler.run` is the long-running poller used by the rake task. `BuildJob#perform` calls `Build#build!` and, if the build finished in `waiting` with a plan that has children, kicks off `plan.build_children!`.
- Build configuration is the DSL in `app/lib/tiny_ci/dsl.rb`. Plan steps are stored as Ruby source in the DB and `instance_eval`'d — that is a documented RCE; replacing with a sandboxed / structured step format is a P0 in `docs/modernize.md` §3.6, and plan editing must remain admin-gated until then.
- New step types (e.g. `bundle exec rspec`): add a class under `TinyCI::Steps::Builder::*` and a method on `DSL`. No plugin loader.
- New SCMs: subclass `TinyCI::SourceControl::Base`, expose `update`. `repository :foo` will resolve `TinyCI::SourceControl::Foo`.
- New notifiers: subclass `TinyCI::Notifier::Base`. The `inherited` hook auto-registers them.
- Locales live in `config/locales/` (English + German). Translations that interpolate HTML must end in `_html` so Rails preserves `html_safe`.
- A `SETUP=true` environment variable short-circuits initialization (skips ActiveRecord) so the first-run setup wizard can run before the database exists. The wizard is reached at `/admin/setup`.
- Default port is 7199.

## Testing

- Test::Unit + Mocha. Run with `bin/rails test`.
- `test/test_helper.rb` requires `rails/test_help` and `mocha/minitest`. `test/functional/test_helper.rb` adds session-based `login_with`/`logout` helpers.
- Integration tests live in `test/integration/` (legacy `test/functional/models/` was renamed to avoid class-name collisions).
- 3 expected skips: 2 SSH tests use `Net::SSH::Test`'s scripted-channel API which is broken on net-ssh 7.x; 1 source_control_base_test only constructs an object with no assertions.
- **Naming convention:** test names use the imperative `should X` form to match the existing suite (e.g. `test "should validate"`, `test "should clone slave"`). Don't drift to `test "saves X"` or `test "regression for Y"` — match what's around the file you're touching.

## Notes / Gotchas

- Modern Ruby's Psych YAML parser is strict. Don't put `[ :symbol1, :symbol2 ]` in YAML files (use `[symbol1, symbol2]` or quote them).
- Translations that interpolate HTML must end in `_html` (`t('foo.bar_html', link: link_to(...))`), or Rails escapes the entire result.
- `<% form_for ... %>` (no `=`) was Rails 2 buffer-style; Rails 3+ requires `<%= form_for ... %>` or the form renders blank.
- Mocha's `mock(:method)` doesn't expect a call — use `stub(method: nil)` for a permissive mock.
- `belongs_to :foo` adds implicit presence validation in Rails 5+. Tests that previously set `foo_id: 1` against a non-existent record now need a real record.
- Internet Explorer is explicitly unsupported (per README).
