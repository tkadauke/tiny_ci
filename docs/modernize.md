# TinyCI — 2026 Modernization Roadmap

> Opinionated, concrete recommendations for bringing this codebase from Rails 2.3 (circa 2009) into production-ready 2026 shape. This is a CI system, so we address both the codebase itself and the meta-irony of how its own pipeline should be run.

---

## 1. Executive Summary

- **Upgrade Rails from 2.3.16 to 8.x** — the current version is end-of-life by ~13 years; every dependency it drags along (Rack 1.1, ActiveRecord 2.x, Authlogic 2.1) carries known CVEs and is incompatible with modern Ruby.
- **Replace DRb + fork-based scheduler with Solid Queue (or Sidekiq 7)** — the hand-rolled `fork`/`DRb`/`MessageQueue` scheduler is the single largest reliability and portability risk; a battle-tested background-job system removes a category of bugs.
- **Replace Juggernaut (abandoned Flash/Socket.IO 0.x hybrid) with Action Cable or Hotwire Turbo Streams** — Juggernaut is completely unmaintained and requires a separate Node process; Action Cable ships with Rails and uses standard WebSockets.
- **Add a Dockerfile + GitHub Actions pipeline** — this CI server has zero CI of its own; dogfooding a proper pipeline (with pinned SHA actions, dependency caching, and OIDC-based deploys) is both a correctness requirement and a credibility statement.
- **Introduce Dependabot, CodeQL, and `bundler-audit`** — the lockfile references gems with HTTP (not HTTPS) as the remote source; there is no automated vulnerability scanning anywhere in the project.

---

## 2. Current State

| Dimension | Current |
|---|---|
| Language | Ruby (version unspecified in Gemfile; compatible with ~1.8.7/1.9.2 era) |
| Framework | Rails 2.3.16 (released 2013, EOL) |
| ORM | ActiveRecord 2.3.16 (`named_scope`, `find(:all)`) |
| Auth | Authlogic 2.1.3 |
| Real-time push | Juggernaut 0.5.8 (abandoned; Node.js + Flash fallback) |
| Background jobs | Hand-rolled: `fork` + DRb + `MessageQueue` + `script/scheduler` |
| Build dispatch | `fork { exec "script/builder", build.id.to_s }` per build |
| Remote execution | `Net::SSH` 2.6.5 with plaintext password in DB |
| Database | MySQL (via `mysql` gem — the old C extension, not `mysql2`) |
| Routing | Rails 2 `map.resources` style |
| Test framework | Test::Unit (unit/functional) + RSpec 1.3 + Cucumber 1.2 + Webrat |
| Coverage | `rcov` (Ruby 1.8-era; incompatible with Ruby 2+) |
| CI provider | **None** — no `.travis.yml`, no `.github/workflows/`, no CI at all |
| Container | **None** — no Dockerfile |
| Lockfile source | `http://rubygems.org/` (plain HTTP, not HTTPS) |
| Version | 0.6 |
| Last schema migration | 2009-12-08 |

---

## 3. Recommendations

### 3.1 Language / Runtime / Framework

**Target: Ruby 3.3.x + Rails 8.0.x**

The migration is substantial but tractable because TinyCI is a small application (~10 models, ~10 controllers).

**Ruby upgrade path:**

1. Install Ruby 3.3 via `rbenv` or `mise`. Add a `.ruby-version` file:
   ```
   3.3.4
   ```
2. Run `bundle exec ruby -w` and fix every deprecation warning before touching Rails.
3. The immediate Ruby blockers are: `named_scope` (renamed `scope` in Rails 3), `find(:all)` (removed in Rails 4), and `attr_accessible`/`attr_protected` (moved to Strong Parameters in Rails 4).

**Rails upgrade path — step through major versions, do not skip:**

| Step | From | To | Key task |
|---|---|---|---|
| 1 | 2.3.16 | 3.2.x | `scope`, `find(:all)`, new router DSL, remove `vendor/plugins` |
| 2 | 3.2.x | 4.2.x | Strong Parameters, `ApplicationRecord`, ActiveJob (replace custom scheduler stub) |
| 3 | 4.2.x | 5.2.x | API mode option, Action Cable (replace Juggernaut), Zeitwerk prep |
| 4 | 5.2.x | 7.2.x | Zeitwerk autoloader, system tests, `config.load_defaults` |
| 5 | 7.2.x | 8.0.x | Solid Queue, Solid Cable, Propshaft, Authentication generator |

Use the [RailsDiff](https://railsdiff.org) tool at each step. The `rails app:update` task generates a diff of config changes needed.

**Replace Authlogic with Rails 8 built-in authentication generator:**

```bash
rails generate authentication
```

This produces a `User` model with `has_secure_password`, `Session` controller, and BCrypt — no gem required.

**Replace `mysql` gem with `mysql2` or `trilogy`:**

```ruby
# Gemfile
gem 'trilogy'  # or gem 'mysql2'
```

`trilogy` is now the Rails default MySQL adapter and is maintained by GitHub.

---

### 3.2 Dependencies

**Immediate hygiene actions:**

1. **Fix the Gemfile source** — change `source :rubygems` to `source "https://rubygems.org"` (HTTP → HTTPS).
2. **Regenerate the lockfile** — the existing `Gemfile.lock` references gems that no longer exist at those versions on RubyGems.
3. **Run `bundler-audit`** to surface CVEs in the locked dependency tree:
   ```bash
   gem install bundler-audit
   bundle audit check --update
   ```
4. **Add `ruby "3.3.4"` to the Gemfile** so Bundler enforces the runtime version.

**Deprecate / replace dead gems:**

| Current gem | Status | Replacement |
|---|---|---|
| `juggernaut 0.5.8` | Abandoned ~2012 | Action Cable + Turbo Streams |
| `rcov` | Ruby 1.8 only | `simplecov` |
| `rspec 1.3` | EOL | `rspec 3.x` |
| `rspec-rails 1.3.2` | EOL | `rspec-rails 7.x` |
| `webrat 0.7.0` | Abandoned | `capybara` |
| `cucumber-rails 0.3.0` | Very old | `cucumber-rails 3.x` |
| `fastercsv` | Merged into Ruby stdlib as `CSV` | Remove |
| `mysql` (C ext) | Deprecated | `trilogy` or `mysql2` |
| `authlogic 2.1.3` | Unmaintained | Rails built-in auth |
| `mocha 0.9.8` | Upgrade | `mocha 2.x` or `rspec-mocks` |
| `ya2yaml` | Unmaintained | `psych` (stdlib) |
| `RedCloth` | Unmaintained | `commonmarker` or `kramdown` |

**Enable Dependabot:**

Create `.github/dependabot.yml`:

```yaml
version: 2
updates:
  - package-ecosystem: bundler
    directory: "/"
    schedule:
      interval: weekly
    groups:
      minor-patch:
        update-types: [minor, patch]
```

---

### 3.3 Testing

**Current coverage: Test::Unit + RSpec 1.3 + Cucumber + Webrat — no coverage enforcement, no mutation testing.**

**Target state:**

- Consolidate on **RSpec 3.x** for unit/functional tests (the project already uses RSpec for some things; unify).
- Replace Webrat with **Capybara + Cuprite** (headless Chrome driver — no Selenium dependency).
- Replace `rcov` with **SimpleCov** and enforce a coverage floor:
  ```ruby
  # spec/spec_helper.rb
  require 'simplecov'
  SimpleCov.start 'rails' do
    minimum_coverage 80
    add_filter '/spec/'
  end
  ```
- Add **mutation testing** with `mutant` to validate test quality for core domain logic (scheduler, resource matching, DSL evaluation):
  ```bash
  gem 'mutant-rspec', group: :test
  bundle exec mutant --include lib --require tiny_ci -- 'TinyCI::Resources*' 'TinyCI::Scheduler*'
  ```
- Add **system tests** using Rails system test infrastructure (Capybara + Cuprite) to replace the Cucumber/Webrat feature tests. Cucumber is high-ceremony; the existing `.feature` files can be converted to RSpec feature specs or Rails system tests.
- Module tests (`rake test:modules`) should be incorporated into the main test suite rather than isolated `Dir.chdir` calls.

**Coverage target: 80% line coverage, 60% branch coverage, enforced in CI.**

---

### 3.4 CI/CD for the CI System

TinyCI has no CI pipeline of its own. This is the most critical gap — a CI server that does not run its own tests on pull requests is a credibility problem.

**Add GitHub Actions as the immediate CI provider:**

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [master]
  pull_request:

permissions:
  contents: read

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: root
          MYSQL_DATABASE: tiny_ci_test
        ports: ["3306:3306"]
        options: --health-cmd="mysqladmin ping" --health-interval=10s

    steps:
      - uses: actions/checkout@v4                    # pinned by tag (update to SHA once stable)
      - uses: ruby/setup-ruby@v1
        with:
          ruby-version: '3.3'
          bundler-cache: true                        # caches vendor/bundle automatically

      - name: Set up database
        env:
          RAILS_ENV: test
        run: |
          cp config/database.yml.example config/database.yml
          bundle exec rails db:schema:load

      - name: Run tests
        run: bundle exec rspec

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: coverage/coverage.xml
```

**Pin all actions to SHA once they are audited:**

```yaml
# Prefer pinned SHA over tag for supply chain security:
- uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683  # v4.2.2
- uses: ruby/setup-ruby@32110d4e7d12b7b281b6b322f9b8b2b9e8b90b0a  # v1.207.0
```

**Add separate workflow for security scanning:**

```yaml
name: Security

on:
  schedule:
    - cron: '0 6 * * 1'    # Monday mornings
  push:
    branches: [master]

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ruby/setup-ruby@v1
        with:
          ruby-version: '3.3'
          bundler-cache: true
      - run: gem install bundler-audit && bundle audit check --update

  codeql:
    uses: github/codeql-action/init@v3
    with:
      languages: ruby
```

**Dogfooding opportunity:** once the Rails upgrade is complete, run TinyCI's own build pipeline *through TinyCI itself* as an integration test of the product. This validates the scheduler, builder plugins, and notification system end-to-end.

---

### 3.5 Architecture

**Scheduler: replace DRb + fork model with Solid Queue**

The current scheduler (`lib/tiny_ci/scheduler/`) uses:
- A singleton `Runner` that forks a process per build (`fork { exec "script/builder", build.id.to_s }`)
- A `DRb` server for cross-process stop signals
- A hand-rolled `MessageQueue` for internal communication
- A `SIGCHLD` trap for process reaping

This approach is fragile: `fork` is unsafe inside multi-threaded processes, DRb has no authentication, and the `0.5s` polling loop is wasteful.

**Replace with Solid Queue (ships with Rails 8):**

```ruby
# Gemfile
gem 'solid_queue'   # included in Rails 8 default stack

# config/queue.yml
default: &default
  dispatchers:
    - polling_interval: 1
      batch_size: 500
  workers:
    - queues: builds
      threads: 5
```

Build execution becomes a standard ActiveJob:

```ruby
class BuildJob < ApplicationJob
  queue_as :builds

  def perform(build_id)
    build = Build.find(build_id)
    TinyCI::DSL.evaluate(build)
  end
end
```

The slave/resource matching logic in `Slave.find_free_slave_for` becomes a Solid Queue concurrency control or a custom dispatcher.

**Real-time UI: replace Juggernaut with Hotwire Turbo Streams + Action Cable**

Juggernaut is abandoned and requires a separate Node.js process. Rails 8 ships Action Cable and Hotwire by default:

```ruby
# app/models/build.rb
after_update_commit -> { broadcast_replace_to "builds", partial: "builds/build", locals: { build: self } }
```

The dashboard auto-refresh becomes a `<turbo-stream-source>` tag with zero JavaScript.

**Remove `acts_as_list` dependency** — the `position` column on builds is only used for queue ordering; Solid Queue handles this natively.

**API design:** The routing is Rails 2 `map.resources`. After upgrading to Rails 8, adopt resource routing with `only:` restrictions and add a JSON API layer (`respond_to :json`) to allow programmatic triggering of builds without screen-scraping.

**Plugin architecture:** The `modules/` directory plugin system (each module has its own `init.rb` and `Rakefile`) predates Rails engines. Migrate plugins to proper **Rails Engines** or extract them as standalone gems:

```
tiny_ci-git       # was modules/scm/git
tiny_ci-rake      # was modules/builders/rake
tiny_ci-email     # was modules/notifiers/email
tiny_ci-capistrano # was modules/deployers/capistrano
```

This enables independent versioning and testing of each integration.

---

### 3.6 Code Quality

**Linting — add RuboCop with the Rails and performance cops:**

```ruby
# Gemfile
gem 'rubocop', require: false
gem 'rubocop-rails', require: false
gem 'rubocop-performance', require: false
gem 'rubocop-rspec', require: false
```

```yaml
# .rubocop.yml
require:
  - rubocop-rails
  - rubocop-performance
  - rubocop-rspec

AllCops:
  NewCops: enable
  TargetRubyVersion: 3.3

Rails:
  Enabled: true
```

Run `rubocop --auto-correct-all` after each Rails version step to fix mechanical issues.

**Formatting — use `rubocop --fix-layout` or `standardrb`** as a zero-config alternative to a bespoke RuboCop config.

**Pre-commit hooks — add `lefthook`:**

```yaml
# lefthook.yml
pre-commit:
  commands:
    rubocop:
      glob: "*.rb"
      run: bundle exec rubocop --fail-level warning {staged_files}
    bundler-audit:
      run: bundle audit check
```

**Type checking — add Sorbet or steep (P2):** Given the age of the codebase, full type coverage is out of scope initially. Add `sorbet` stubs for the core domain (`Build`, `Plan`, `Slave`, `TinyCI::Scheduler::*`) as a P2 item.

**Remove dangerous patterns:**
- `slaves` table stores `password` in plaintext — replace with SSH key authentication (see Security section).
- `eval`-equivalent: `TinyCI::DSL` uses `instance_eval(build.plan.steps)` on user-supplied string content. This is a critical **remote code execution** vulnerability. Replace with a sandboxed DSL or a YAML/structured step format.

---

### 3.7 Observability

**Structured logging — replace `puts` with tagged logging:**

The scheduler runner currently uses bare `puts` for error reporting (`puts e.message, e.backtrace`). Replace throughout with Rails tagged logging:

```ruby
Rails.logger.tagged("scheduler") do
  Rails.logger.error("Schedule error: #{e.message}", backtrace: e.backtrace.first(10))
end
```

Use `lograge` for single-line JSON request logs in production:

```ruby
gem 'lograge'
# config/initializers/lograge.rb
Rails.application.configure do
  config.lograge.enabled = true
  config.lograge.formatter = Lograge::Formatters::Json.new
end
```

**OpenTelemetry — instrument the build pipeline:**

```ruby
gem 'opentelemetry-sdk'
gem 'opentelemetry-instrumentation-rails'
gem 'opentelemetry-instrumentation-active_job'
gem 'opentelemetry-exporter-otlp'
```

Key spans to add manually:
- `tiny_ci.build.queued` → `tiny_ci.build.dispatched` → `tiny_ci.build.finished`
- `tiny_ci.step.run` with attributes: `step.type`, `slave.name`, `exit_code`

This lets operators see build latency broken down by scheduling wait vs. execution time.

**Metrics — expose a `/metrics` endpoint (Prometheus format):**

```ruby
gem 'prometheus_exporter'
```

Track: queue depth, running builds per slave, build duration histogram (by project/plan), failure rate.

**Error tracking — add Sentry SDK:**

```ruby
gem 'sentry-ruby'
gem 'sentry-rails'
```

The scheduler's `rescue => e; puts e.message` swallows errors silently. Route them to Sentry with full context.

---

### 3.8 Security & Supply Chain

**Critical vulnerabilities in the current design:**

| Issue | Severity | Fix |
|---|---|---|
| `instance_eval(build.plan.steps)` — arbitrary Ruby execution from DB | **Critical** | Replace with structured YAML step format |
| SSH passwords stored in plaintext in `slaves` table | **High** | Switch to SSH key pairs; store private keys encrypted with Rails credentials |
| Gemfile source uses `http://` (not `https://`) | High | Change to `https://rubygems.org` |
| DRb server with no authentication on `druby://localhost:2250` | Medium | Remove DRb; replace with Solid Queue |
| No CSRF protection audit (Rails 2.3 has weak defaults) | Medium | Rails 8 CSRF defaults are correct; verify after upgrade |
| `Net::SSH` password auth across network | Medium | SSH key auth only |

**Supply chain hardening:**

1. **Dependabot** — enable for Bundler (see 3.2).
2. **CodeQL** — add to GitHub Actions (see 3.4).
3. **SBOM generation with Syft:**
   ```bash
   # In CI, after build:
   syft . -o spdx-json > sbom.spdx.json
   ```
   Attach as a build artifact.
4. **`bundler-audit`** in every CI run (see 3.4).
5. **Secret scanning** — enable GitHub secret scanning on the repository (free for public repos, available for private).
6. **Signed commits** — require signed commits on `master` via branch protection rules.

---

### 3.9 Container / Deployment

**Add a multi-stage Dockerfile:**

```dockerfile
# syntax=docker/dockerfile:1
FROM ruby:3.3-slim AS base
WORKDIR /app
RUN apt-get update && apt-get install -y \
    default-libmysqlclient-dev build-essential git \
    && rm -rf /var/lib/apt/lists/*

FROM base AS deps
COPY Gemfile Gemfile.lock ./
RUN bundle config set --local without 'development test' \
 && bundle install --jobs 4 --retry 3

FROM base AS app
COPY --from=deps /usr/local/bundle /usr/local/bundle
COPY . .
RUN bundle exec rails assets:precompile RAILS_ENV=production SECRET_KEY_BASE=dummy
EXPOSE 7199
CMD ["bundle", "exec", "puma", "-C", "config/puma.rb"]
```

**Replace WEBrick with Puma** (already the Rails default; just add `config/puma.rb`).

**Add `docker-compose.yml` for local development:**

```yaml
services:
  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: password
      MYSQL_DATABASE: tiny_ci_development
  web:
    build: .
    ports: ["7199:7199"]
    depends_on: [db]
    environment:
      DATABASE_URL: mysql2://root:password@db/tiny_ci_development
  worker:
    build: .
    command: bundle exec solid_queue start
    depends_on: [db]
```

**Image signing with cosign:**

```yaml
# In GitHub Actions, after docker/build-push-action:
- uses: sigstore/cosign-installer@v3
- run: cosign sign --yes ${{ env.IMAGE }}@${{ steps.build.outputs.digest }}
```

**Use OIDC for Docker Hub / GHCR push** — no long-lived secrets:

```yaml
permissions:
  id-token: write
  packages: write
```

---

### 3.10 Developer Experience

**Add a devcontainer:**

Create `.devcontainer/devcontainer.json`:

```json
{
  "name": "TinyCI Dev",
  "dockerComposeFile": "../docker-compose.yml",
  "service": "web",
  "workspaceFolder": "/app",
  "features": {
    "ghcr.io/devcontainers/features/git:1": {},
    "ghcr.io/devcontainers/features/github-cli:1": {}
  },
  "postCreateCommand": "bundle install && rails db:setup",
  "customizations": {
    "vscode": {
      "extensions": ["Shopify.ruby-lsp", "misogi.ruby-rubocop"]
    }
  }
}
```

**Local dev setup (replace `script/tiny_ci`):**

```bash
# One command to start everything:
bin/dev
```

Add a `Procfile.dev` for `foreman` or `overmind`:

```
web:       bundle exec rails server -p 7199
worker:    bundle exec solid_queue start
cable:     bundle exec puma -C config/cable_puma.rb
```

**Add `bin/setup` script** (Rails convention):

```bash
#!/usr/bin/env bash
set -e
bundle install
cp config/database.yml.example config/database.yml 2>/dev/null || true
bundle exec rails db:setup
echo "Setup complete. Run bin/dev to start."
```

**Improve documentation:**

- Convert `README.rdoc` to `README.md` (GitHub renders RDoc but Markdown is the standard).
- Add a `CONTRIBUTING.md` with the test commands and branch strategy.
- Add inline YARD documentation to `TinyCI::DSL`, `TinyCI::Scheduler::Runner`, and the plugin interfaces.

---

### 3.11 AI / Agent Readiness

**Add `CLAUDE.md` at repo root:**

```markdown
# TinyCI — CLAUDE.md

## What this is
TinyCI is a Rails CI server with a plugin architecture for builders, SCMs, notifiers, and deployers.

## Running tests
bundle exec rspec                    # unit + functional
bundle exec rspec spec/system        # system tests (requires Chrome)
bundle exec rails test:modules       # module plugin tests

## Key architectural concepts
- `TinyCI::DSL` evaluates build steps (lib/tiny_ci/dsl.rb)
- `TinyCI::Scheduler::Runner` polls and dispatches builds (lib/tiny_ci/scheduler/runner.rb)
- Plugins live in modules/ — each has an init.rb that extends the DSL
- Slaves are remote build agents connected via SSH or localhost

## Conventions
- Models: app/models/
- Scheduler: lib/tiny_ci/scheduler/
- Shell adapters: lib/tiny_ci/shell/ (localhost.rb, ssh.rb)
- Plugin step implementations: modules/<type>/<name>/lib/

## Do not
- Run `rails console` in production against the live DB without a backup
- Modify schema.rb directly — use migrations
- Add new gems without running `bundle audit check`
```

**Conventions for agent work:**

- All business logic should have RSpec unit tests before an agent modifies it — agents should not be trusted to write tests from scratch for untested code.
- The `TinyCI::DSL#instance_eval` pattern (see Security section) must be replaced before any agent is allowed to generate new step types — it is a direct RCE vector.
- Add a `bin/ci` script that agents can run to verify the build without knowledge of the full test suite:
  ```bash
  #!/usr/bin/env bash
  bundle exec rubocop --fail-level warning
  bundle exec rspec --format progress
  bundle audit check
  ```

---

## 4. Prioritized Roadmap

| Priority | Item | Effort | Impact |
|---|---|---|---|
| **P0** | Fix Gemfile source: `http://` → `https://rubygems.org` | 5 min | High — active MitM risk |
| **P0** | Add GitHub Actions CI workflow (test + bundler-audit) | 2 h | High — no tests run on PRs today |
| **P0** | Replace `instance_eval(build.plan.steps)` with safe step DSL | 1–2 d | Critical — RCE from DB content |
| **P0** | Remove plaintext SSH passwords from slaves table | 1 d | High — credential exposure |
| **P0** | Add `CLAUDE.md` for agent/contributor orientation | 1 h | Medium |
| **P1** | Rails upgrade: 2.3 → 3.2 → 4.2 (step through with `rails app:update`) | 2–3 w | High — unlocks modern tooling |
| **P1** | Replace Webrat + RSpec 1.3 with Capybara + RSpec 3 | 1 w | High — existing tests cannot run on Ruby 3 |
| **P1** | Add multi-stage Dockerfile + `docker-compose.yml` | 1 d | High — reproducible environments |
| **P1** | Add Dependabot config | 1 h | High — automated CVE tracking |
| **P1** | Replace `rcov` with SimpleCov; enforce 80% floor in CI | 2 h | Medium |
| **P1** | Add RuboCop with Rails/Performance cops | 4 h | Medium — consistency |
| **P1** | Add `bin/setup` + `bin/dev` + `Procfile.dev` | 2 h | Medium — DX |
| **P2** | Rails upgrade: 4.2 → 5.2 → 7.2 → 8.0 | 3–4 w | High — modern Rails features |
| **P2** | Replace DRb + fork scheduler with Solid Queue | 1–2 w | High — reliability |
| **P2** | Replace Juggernaut with Action Cable + Turbo Streams | 1 w | High — removes Node.js dependency |
| **P2** | Replace Authlogic with Rails 8 built-in auth | 3 d | Medium |
| **P2** | Migrate `modules/` plugins to Rails Engines / gems | 2 w | Medium — independent versioning |
| **P2** | Add OpenTelemetry instrumentation | 3 d | Medium — build pipeline visibility |
| **P2** | Add structured logging (lograge) + Sentry | 1 d | Medium |
| **P2** | Add devcontainer | 2 h | Medium — Codespace/DX |
| **P2** | Image signing with cosign + OIDC push | 4 h | Medium — supply chain |
| **P2** | Mutation testing with mutant for scheduler/DSL | 3 d | Medium — test quality |
| **P2** | Add Sorbet type signatures for core domain | 2 w | Low-Medium |
| **P2** | Convert README.rdoc → README.md + add CONTRIBUTING.md | 2 h | Low |

---

## 5. Risks & Non-Goals

### Risks

**Rails migration complexity:** The gap between Rails 2.3 and Rails 8 spans 6 major versions. Each major version has breaking changes. The step-by-step approach mitigates this but requires developer bandwidth for 6–10 weeks. Test coverage must be established *before* starting the migration, not after.

**`instance_eval` removal:** The build step DSL is currently user-facing Ruby code stored in the database. Replacing it with a structured format (YAML steps) is a breaking change for any existing TinyCI users. A migration path (run old format read-only, write new format) will be needed.

**Juggernaut dependency:** `juggernaut` 0.5.8 requires a very old Node.js version (0.x era). If anyone tries to run this system today, the real-time dashboard is already broken. Removing it is low-risk.

**MySQL `mysql` gem:** The old `mysql` C extension does not compile on Ruby 3. This is a hard blocker for any Ruby upgrade. Switch to `trilogy` first, independently of the Rails upgrade.

### Non-Goals

- **Supporting Internet Explorer:** The README states "IE is not supported." Do not add IE/Edge-legacy compatibility layers.
- **Polling SCMs:** The README already notes "TinyCI does not yet poll GIT for changes." Adding webhook-based triggers is useful (P2) but is a feature, not modernization.
- **Multi-database support:** The application is MySQL-specific. Adding PostgreSQL support is a feature enhancement; skip it unless there is a specific operator requirement.
- **Full Sorbet/RBS coverage on first pass:** Type annotation is high-effort on a legacy codebase. Instrument core paths only; do not type-annotate views or generated code.
- **Preserving the `script/` directory:** All `script/server`, `script/scheduler`, `script/builder` processes are Rails 2 conventions. They will be naturally removed as part of the Rails upgrade; do not attempt to preserve them.
- **Keeping the `vendor/gems` self-contained distribution model:** The `rake dist` task packages gems into `vendor/`. Modern deployment via Docker images makes this unnecessary and should be retired.
