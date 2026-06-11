# Manual E2E test plan: `tiny_ci` building `tiny_ci`

The core idea: run TinyCI locally, point it at this repo, and have it run our
own test suite. If the build goes green, the modernization is functional
end-to-end.

## Prep (one-time)

**Make sure the test suite is clean and the repo is committed.**
```bash
cd /Users/tkadauke/code/tiny_ci
git status                 # should be clean
bin/rails test             # 344 runs, 0 failures
```

**Reset the database.** We're going to use TinyCI's own dev SQLite DB; clear
it so we start from "no users → first user becomes admin."
```bash
rm -f storage/development.sqlite3*
bin/rails db:schema:load
```

**Pick a builds workspace.** TinyCI's `Worker#base_path` is where it clones
repos and runs commands. Pick somewhere outside this repo so we don't
recurse:
```bash
mkdir -p /tmp/tinyci-builds
```

## 1. Bring TinyCI up

In one terminal:
```bash
bin/dev          # starts web on :7199 + scheduler in parallel
```
Watch for both processes printing startup. If `bin/dev` complains about
foreman, `gem install foreman`.

Verify in a browser: <http://localhost:7199> renders the dashboard.

## 2. Create the initial admin user

The first registered user gets `Role::InitialAdmin` automatically
(`Guest#initial_admin?` returns true while `User.count == 0`).

In the browser:
1. Click **Sign up** in the top right.
2. Fill in: login `admin`, email `admin@example.com`, password `password`
   (twice), submit.
3. You should be logged in and have full admin permissions.

## 3. Configure a localhost worker

1. Top nav → **Workers** → **New worker**.
2. Fill in:
   - **Name:** `localhost`
   - **Protocol:** `localhost`
   - **Base path:** `/tmp/tinyci-builds`
   - **Capabilities:** leave blank (or `linux, macos, ruby` — these are
     unnumbered tags the resource matcher treats as opaque)
   - **Max builds:** `1`
3. Submit.

## 4. Create the project + plan

1. Top nav → **Projects** → **New project**.
2. Name: `tiny_ci`. Submit.
3. On the project page → **New plan**.
4. Fill in:
   - **Name:** `test`
   - **Repository URL:** `/Users/tkadauke/code/tiny_ci` (git clones from a
     local directory just fine)
   - **Requirements:** leave blank
   - **Steps:**
     ```ruby
     env "BUNDLE_GEMFILE" => nil, "BUNDLER_VERSION" => nil, "RUBYOPT" => nil
     sh "bundle install --quiet"
     sh "bin/rails db:test:prepare"
     sh "bin/rails zeitwerk:check"
     sh "bin/rails test"
     ```
5. Submit. The DSL validator (closed in `c2fa75a`) will reject anything
   outside `sh / rake / cap / cd / env / repository / update`; what you
   wrote stays inside that allowlist.

## 5. Kick off a build

1. From the plan page → **Builds** → **Build now** (or POST to
   `/projects/tiny_ci/plans/test/builds`).
2. The build appears with status `pending`. Within ~0.5s the scheduler
   should pick it up: status flips to `running`, worker assigned, page
   auto-refreshes via Turbo Streams.
3. Watch the output stream. Expected sequence:
   - `git clone …` → workspace created at `/tmp/tinyci-builds/tiny_ci/test`
   - `bundle install` → resolves the modern Gemfile
   - `bin/rails db:test:prepare` → fresh SQLite
   - `bin/rails zeitwerk:check` → "All is good!"
   - `bin/rails test` → "344 runs, 0 failures"
4. Status flips to `success`. `finished_at` set. The build appears in
   **Recently finished builds** on the dashboard.

## 6. Verify the report views

1. Click the build → the **details** report tab. The rake-output parser
   groups output by `** Execute <task>` markers; with `bin/rails test`
   you'll see each step as a section.
2. Try **gist** view as well.
3. Trigger a second build to confirm queueing works (it should pick up the
   next pending build automatically).

## 7. Force a failure to confirm the failure path

1. Edit the plan, replace the last step with `sh "false"`.
2. Trigger a new build.
3. Expected: status `failure`, `finished_at` set, output captures
   everything up to the failure point, **next build** auto-trigger does
   NOT happen.

## Common gotchas (with fixes)

- **Bundler env leaks into the child shell.** `bin/dev` runs the scheduler
  under Bundler; `Shell::Localhost.run` does
  `IO.popen("sh -c '<env> <cmd>'")` without clearing parent Bundler env.
  The `env "BUNDLE_GEMFILE" => nil, …` line above unsets the leaky vars
  at the DSL level. Without it `bundle install` inside the build will
  get confused about which Gemfile is "yours."
- **Wrong Ruby on the worker.** The scheduler shells out using whatever
  Ruby the scheduler process is using. Run `bin/dev` under
  `rbenv shell 3.2.3` (or have a `.ruby-version` rbenv-shim picks up — we
  have one).
- **`git clone` from a local path with a dirty working tree.** Local-path
  clones use the working copy if Git can hardlink, but uncommitted
  changes won't ship. Commit (locally — no need to push) before each
  build, or set `Repository URL` to the GitHub remote once you push.
- **Build appears stuck in `pending`.** Means the scheduler isn't running,
  or no worker matches. Check that `bin/dev` is showing `scheduler` lines,
  and that the worker isn't `offline: true`. `bin/rails console` →
  `Build.pending; Worker.least_busy.to_a` to inspect.
- **Build appears stuck in `running`.** ActiveJob's `:async` adapter loses
  jobs if the process dies; if you killed `bin/dev` mid-build, the
  build's status didn't get cleaned up. `bin/rails console` →
  `Build.running.update_all(status: "stopped", finished_at: Time.now)`.
- **`add_to_output` checks `updated_at < 1.second.ago` before flushing.**
  Output won't appear instantly while the build is running — only every
  second. That's not a hang.
- **Real-time UI not updating.** Turbo Streams need Action Cable. Verify
  `<%= turbo_stream_from "queue" %>` appears in the rendered HTML
  (view-source the dashboard) and that the `cable.yml` adapter is `async`
  in dev. Watch the browser DevTools network tab for the `/cable`
  WebSocket.
- **`bin/rails test` inside the build runs your CHANGE under test, not
  master.** That's the point of CI, but it's also why a flaky test will
  show as red here even if master is green — make sure committed master
  is green before triggering.

## What this validates end-to-end

If a build of `tiny_ci` on `tiny_ci` reaches `success`, you've exercised:

- `Build#build!` lifecycle (pending → running → success)
- `BuildJob` enqueue + perform via ActiveJob
- `TinyCI::Scheduler.tick` polling, `Build.pending`,
  `Worker.find_free_worker_for`
- `TinyCI::Shell::Localhost` real subprocess + working-dir + env handling
- `TinyCI::SourceControl::Git` real clone + workspace creation
- `TinyCI::DSL::Validator` accepting a real plan
- DSL `sh / env` evaluation
- Output capture + CSV encoding + flush
- Turbo Streams refresh on status change (queue and build pages)
- Notifier dispatch (the email backend skips silently with no SMTP
  config; growl skips with no host)
- Plan stats update after build finishes (`Plan#update_build_stats!`)

That's everything important except remote SSH builds. To exercise that
path: add a second worker with `protocol: ssh`, point at a host you
control, and trigger again.
