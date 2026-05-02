# TinyCI

[![CI](https://github.com/tkadauke/tiny_ci/actions/workflows/ci.yml/badge.svg)](https://github.com/tkadauke/tiny_ci/actions/workflows/ci.yml)

TinyCI is a small, opinionated continuous integration server. It schedules
and runs builds across local and remote build slaves, supports chained and
parallel (child) builds, and exposes a web UI on port 7199. It is intended
primarily for Ruby on Rails projects using Git and Test::Unit, but builds
can be configured for any language.

The repository was migrated from Rails 2.3 to Rails 7.2 in early 2026 (see
`docs/modernize.md`). New build steps, SCMs, and notifiers are plain
classes under `app/lib/tiny_ci/` plus a method on `TinyCI::DSL` — there is
no longer a `modules/` plugin loader.

## Tech Stack

- Ruby 3.2.3 (`.ruby-version`) — `required_ruby_version: 3.2.3`
- Bundler 4.0.10 (baked into `Gemfile.lock`; see issue #65 for the
  rationale and any future bumps)
- Rails 7.2
- Trilogy / MySQL in production, SQLite in development and test
- Test::Unit + Mocha for the test suite
- ActiveJob (default `:async` adapter) for the build scheduler
- net-ssh for remote build slave communication

## Quickstart

```
bin/setup        # install gems and prepare the database
bin/dev          # run web tier + scheduler together (foreman + Procfile.dev)
```

The web UI listens on port 7199: <http://localhost:7199>.

To run the web tier on its own: `bin/rails server -p 7199`.
To run the scheduler on its own: `bundle exec rake tiny_ci:scheduler`.

## Running Tests

```
bin/rails test              # full suite (~320 runs)
bin/rails zeitwerk:check    # eager-load every autoloaded file
```

CI runs both of the above plus `bundle-audit` on every push and PR; see
`.github/workflows/ci.yml`.

## Documentation

- `docs/manual_test.md` — manual smoke-test checklist for the web UI.
- `docs/modernize.md` — roadmap for the ongoing Rails 7 modernization.
- `CLAUDE.md` — conventions for AI coding agents (also useful as an
  architecture overview for human contributors).
- `CONTRIBUTING.md` — branch naming, commit style, and test conventions.

## License

TODO: no top-level `LICENSE` file exists yet. Vendored plugins under
`vendor/plugins/` ship their own MIT licenses, but the project itself is
currently unlicensed. A project-wide license will be added in a follow-up.
