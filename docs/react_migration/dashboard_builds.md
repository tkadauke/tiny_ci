# Dashboard & Build Details Feature Inventory

Sources read: `app/controllers/start_controller.rb`, `app/controllers/builds_controller.rb`, `app/views/start/*`, `app/views/builds/*`, `app/views/build_reports/details/*`, `app/views/build_reports/gist/*`, `app/helpers/builds_helper.rb`, `app/helpers/application_helper.rb`, `app/models/build.rb`, `app/models/slave.rb`, `app/models/plan.rb`, `app/lib/tiny_ci/report/*`, `app/lib/tiny_ci/output.rb`, `app/lib/tiny_ci/output_parser*`, dashboard/build Cucumber features, and `config/locales/*`. `app/lib/juggernaut.rb` is not present in this checkout; the no-op Juggernaut stub exists in `features/support/mocks.rb`.

## `/` Dashboard Root

- [ ] Route/controller: `root to: "start#index"` loads all slaves into `@slaves` and the 5 newest finished builds into `@recent_builds`.
- [ ] Current page subscribes to `turbo_stream_from "queue"` and enables morph refreshes with scroll preservation.
  > **SPA note:** The React dashboard needs one shared live queue/status/recent-builds feed. WebSocket, SSE, or polling should refresh the queue, slave status, and recent finished widgets when builds are created or statuses change.
- [ ] Quick links render above the widgets:
  - [ ] initial admin sees `Create first administrator account`;
  - [ ] logged-in account creator sees `Create accounts`;
  - [ ] other visitors see `Sign up`;
  - [ ] all visitors see `Create a project` and `Manage build slaves`.
- [ ] Build queue widget title is `Build queue`; it renders `Build.pending` via the shared build list partial.
- [ ] Slave status widget title is `Slave status`; it renders every configured slave.
- [ ] Recently finished widget title is `Recently finished builds`; it renders `@recent_builds`, ordered by `created_at DESC`, limited to 5.
- [ ] XHR requests to the dashboard render only the `_queue` partial, which contains all three widgets.
  > **SPA note:** Preserve the ability to refresh only dashboard widget data without reloading the whole shell.

## `/` Build Queue Widget

- [ ] Empty queue renders `No builds`.
- [ ] Columns are `Number`, `Name`, `Timestamp`, `Status`, and an unlabeled action column.
- [ ] Number links to build details: `/projects/:project_id/plans/:plan_id/builds/:position`.
- [ ] Name cell links project name to project details and plan/build name to plan details, formatted as `project / plan`.
- [ ] Timestamp links to build details and is formatted with `created_at.to_fs(:timestamp)`.
- [ ] Status cell renders `icons/small/:status.png` plus localized `build.status.:status`.
- [ ] Stop action renders for every unfinished build and uses `button_to` POST to the build stop route, styled as `stop-link`, with `icons/small/stopped.png` and text `Stop`.
- [ ] Current markup is a normal Rails `button_to`; legacy Cucumber support still refers to "remote link" behavior from the older Ajax implementation.
- [ ] Child builds render directly beneath the parent when `build.has_children?`; child number is prefixed with `+`, then the same columns/actions are shown.
- [ ] Cucumber coverage expects a pending build to show its plan name and `Pending`.
- [ ] Cucumber coverage expects following remote link `Stop` to keep the plan visible and update status to `Stopping`.
  > **SPA note:** Stop/cancel should optimistically or reactively show `Stopping` after the POST succeeds, then rely on the live feed to move to `Stopped` when the worker finalizes. Existing server behavior returns `200 OK` for XHR and no body.

## `/` Slave Status Widget

- [ ] Empty slave list renders `No slaves configured.` plus `Configure them now` linking to `/admin/slaves`.
- [ ] Each slave renders its name in bold.
- [ ] Offline slave renders `Slave is offline.` plus `Configure` linking to `/admin/slaves/:name/edit`.
- [ ] Online slave renders a nested build list of `slave.running_builds`.
- [ ] Bored online slave therefore shows the shared build-list empty state: `No builds`.
- [ ] Busy online slave shows the currently running build rows with the same build-list columns, links, status icon/text, and stop action.
- [ ] `Slave#running_builds` includes only builds with status `running`; pending/stopping/waiting builds are not shown as current slave work here.
  > **SPA note:** Slave status must update when builds enter/leave `running` and when slaves are edited online/offline. The current implementation refreshes the `"queue"` Turbo stream on build status changes, but slave online/offline edits are not broadcast from `Slave`.

## `/` Recently Finished Widget

- [ ] Empty recent list renders `No builds`.
- [ ] Columns are `Number`, `Name`, `Timestamp`, `Status`, and `Duration`.
- [ ] Number and timestamp link to build details.
- [ ] Name cell links project name to project details and plan/build name to plan details, formatted as `project / plan`.
- [ ] Status cell renders `icons/small/:status.png` plus localized `build.status.:status`.
- [ ] Duration uses `duration(build.duration)`, which formats non-zero days, hours, minutes, and seconds; nil duration renders blank.
- [ ] Finished scope is `status != pending` and `status != running`, so `waiting`, `stopping`, `success`, `failure`, `error`, `canceled`, and `stopped` qualify for this widget.
  > **SPA note:** The recent list should be recalculated when a build leaves pending/running. Check whether `waiting` and `stopping` should remain included in React or whether the API should match the legacy scope exactly.

## `/projects/:project_id/plans/:plan_id/builds` Build History

- [ ] Requires a logged-in user via `before_action :require_user`.
- [ ] Loads project and plan by route params using `from_param!`.
- [ ] Lists all builds for the plan, including `children: :plan`, ordered by `created_at DESC`.
- [ ] There is no pagination in the controller or view.
- [ ] Page heading is `Builds of Plan <plan link>`; footer link is `Back to Plan`.
- [ ] Current page subscribes to `turbo_stream_from "queue"` and enables morph refreshes with scroll preservation.
  > **SPA note:** React build history should either subscribe to the same build status feed or poll this plan's build list. It must refresh status icons/actions when a build changes state.
- [ ] XHR requests render only the `_list` partial with the current `@builds`.
- [ ] Empty state is `No builds`.
- [ ] Columns match the dashboard queue list: `Number`, `Name`, `Timestamp`, `Status`, action.
- [ ] Status icons use `icons/small/:status.png`; status text uses `build.status.:status`.
- [ ] Child builds render as extra rows below parents with `+` before the child position.
- [ ] Stop action is available for any build where `finished?` is false. `finished?` is true for `success`, `error`, `failure`, `canceled`, and `stopped`; it is false for `pending`, `running`, `waiting`, and `stopping`.

## `/projects/:project_id/plans/:plan_id/builds/:id` Build Details

- [ ] Requires a logged-in user.
- [ ] Finds the build by plan-local `position` (`Build#to_param`), not database id.
- [ ] Report selector accepts `raw`, `details`, or `gist`; any other value falls back to `raw`.
- [ ] XHR requests render only the `_build` partial.
- [ ] Full page subscribes to `turbo_stream_from "build_#{@build.name}_#{@build.position}"`.
- [ ] Full page enables morph refreshes with scroll preservation while the build is not finished.
  > **SPA note:** Build details need live status and output updates. Current model broadcasts the build stream when `output` or `status` changes. React should use WebSocket/SSE for streaming-like output or poll the build resource and append rows without resetting scroll unexpectedly.
- [ ] Header: `Build output of <plan link> #<position>` and, when assigned, `on slave <slave name>`.
- [ ] Metadata definition list:
  - [ ] status: `icons/large/:status.png` plus localized status;
  - [ ] revision: raw revision or `unknown`;
  - [ ] duration: formatted duration;
  - [ ] started by: starter login link plus `(Requested manually)`, only when `@build.starter` exists.
- [ ] Stop button appears when build is `running` or `pending`.
- [ ] Report navigation links always show `Raw output`, `Gist`, and `Details` and route by `?report=raw|gist|details`.
- [ ] Report body renders `No output (yet)` when `@build.output` is blank.
- [ ] Raw output renders every parsed CSV output row with row index, timestamp, command, and escaped line text.
- [ ] Raw output suppresses repeated timestamp display when the integer timestamp equals the previous row timestamp.
- [ ] Raw output suppresses repeated command display when it equals the previous row command.
- [ ] Non-raw reports split output by command and choose a parser by command: `rake` uses `RakeParser`; `cap` uses `CapistranoParser`; other commands render nothing.
- [ ] Finished build footer renders `icons/small/:status.png` plus localized status.
- [ ] Running build footer renders `spinner.gif`.
- [ ] Footer link is `Back to Builds`.

## Build Report Partials: Raw, Details, Gist

- [ ] `build_reports/details/_build_report`: collapsible-ish anchor text `Build`; details show `Build tool`, `Targets`, heading `Tasks`, then each task rendered with `details`. Blank task partials are rejected.
- [ ] `build_reports/gist/_build_report`: same `Build tool`, `Targets`, and `Tasks` structure as details, but renders each task with `gist`.
- [ ] `build_reports/details/_task_report`: anchor `Task <name>`; body renders raw output for the task unless `report.raw_output.blank?`.
- [ ] No gist task partial exists; gist rendering silently drops normal rake task reports because `render_report` rescues `ActionView::MissingTemplate` and returns blank.
- [ ] `build_reports/details/_test_report`: anchor `Test Run <name>`; summary shows `Total time`, `Tests`, `Assertions`, `Failures`, and `Errors`; details list tests sorted by test name.
- [ ] Test report details render each test as an expandable item containing a table with `Test Case`, `Duration`, `Status`.
- [ ] Successful test cases render the test case name as plain text.
- [ ] Failed/error test cases render the test case name as a link with a hidden detail block containing escaped error message and, when present, a backtrace table.
- [ ] Backtrace rows render the parsed invocation columns from the output parser.
- [ ] `build_reports/gist/_test_report`: anchor `Test Run <name>`; summary only, with `Total time`, `Tests`, `Assertions`, `Failures`, and `Errors`.
- [ ] `build_reports/details/_deploy_report`: anchor `Deploy`; details show `Deploy tool`, `Targets`, heading `Tasks`, then each deploy task rendered with `details`.
- [ ] `build_reports/gist/_deploy_report`: anchor `Deploy`; gist shows only `Deploy tool` and `Targets`; deploy tasks/commands are omitted.
- [ ] `build_reports/details/_deploy_task_report`: anchor `Task <name>`; if commands are present, renders each command with `details`.
- [ ] `build_reports/details/_deploy_command_report`: anchor `Command <command>`; if servers are present, renders `Command output:` and one link per server.
- [ ] Deploy command details render one `<pre>` per server, first visible and later ones hidden; server links switch visible output using Prototype helpers. Output lines are joined from `report.output[server].lines`.
- [ ] No gist deploy task or deploy command partials exist; gist deploy rendering omits them.
  > **SPA note:** The old report UI assumes client-side show/hide for expandable sections and deploy server tabs. React should model these as explicit local UI state, independent from build-output live refreshes.

## Output Parsing & Build Types

- [ ] `TinyCI::Output` parses stored CSV rows into timestamp, command, and line fields.
- [ ] Raw output is available for any command because it only needs CSV rows.
- [ ] Parsed build reports appear only for output parts whose command is `rake` or `cap`.
- [ ] Rake parsed reports render a `BuildReport` with `build_tool = "rake"`.
- [ ] Rake task names come from lines matching `** Execute <task>`.
- [ ] Rake tasks named `test`, `test:units`, or `test:functionals` render as `TestReport`; other rake tasks render as `TaskReport`.
- [ ] Rake tests parse per-test-case status from `.`, `F`, and `E` into `success`, `failure`, and `error`.
- [ ] Rake test summary parses `Finished in ... seconds.` and `<n> tests, <n> assertions, <n> failures, <n> errors`.
- [ ] Capistrano parsed reports render a `DeployReport` with `deploy_tool = "cap"`.
- [ ] Capistrano tasks come from lines matching `* executing \`task'`.
- [ ] Capistrano commands come from lines matching `* executing "command"` inside a task.
- [ ] Capistrano command output groups lines by server and channel (`out`/`err`) until `command finished`.

## Stop Build Action

- [ ] `BuildsController#stop` requires login because all `BuildsController` actions run `require_user`.
- [ ] It finds the build by plan-local position, calls `@build.stop!`, returns `head :ok` for XHR, or redirects to the build index for non-XHR.
- [ ] `Build#stop!` delegates to `TinyCI::Scheduler::Client.stop(self)`.
- [ ] Current scheduler client sets `status: "stopping"` only.
- [ ] Shell loops for localhost and SSH reload the build and raise `TinyCI::BuildStopped` when status is `stopping`.
- [ ] `Build#build!` catches `TinyCI::BuildStopped`, flushes output, and finalizes with `status: "stopped"` and `finished_at`.
- [ ] There is no role check beyond being logged in; any authenticated user who can reach the build route can stop it.
  > **SPA note:** Treat stop as cooperative and two-phase: `pending/running` -> `stopping` after command response, then `stopped` after the worker observes the DB status. The UI must handle stop latency and should avoid offering repeated stop clicks once `stopping`.

## Live Update Behavior

- [ ] Legacy Cucumber support includes a no-op `Juggernaut.send_to_channel`, plus no-op DRb stubs, in `features/support/mocks.rb`.
- [ ] `app/lib/juggernaut.rb` was requested for inventory but is absent in this checkout.
- [ ] `ApplicationHelper` documents that old `auto_update` and `juggernaut` helpers were removed and replaced by `turbo_stream_from` plus build broadcasts.
- [ ] `Build` includes `Turbo::Broadcastable`.
- [ ] Build create broadcasts refresh to `"queue"`.
- [ ] Build update broadcasts refresh to `"build_#{name}_#{position}"` when `output` or `status` changes.
- [ ] Build update broadcasts refresh to `"queue"` when `status` changes.
- [ ] Build update also triggers notifier delivery on status changes if notifiers are defined.
- [ ] Build output is buffered and flushed into `Build#output`; flushes update the row and therefore trigger build-detail refreshes.
  > **SPA note:** React needs replacement channels for dashboard queue/status/recent-builds and per-build output/status. WebSocket or SSE is the closest match to Turbo refreshes; polling can work but should preserve scroll and avoid re-rendering the entire raw output table on every tick.

## Status Icons & Text

- [ ] Build statuses defined on `Build`: `pending`, `running`, `waiting`, `success`, `error`, `failure`, `canceled`, `stopping`, `stopped`.
- [ ] Build status text is localized under `build.status.*` in English and German.
- [ ] Small icons exist for build statuses:
  - [ ] `pending` -> `app/assets/images/icons/small/pending.png`;
  - [ ] `running` -> `app/assets/images/icons/small/running.png`;
  - [ ] `success` -> `app/assets/images/icons/small/success.png`;
  - [ ] `failure` -> `app/assets/images/icons/small/failure.png`;
  - [ ] `error` -> `app/assets/images/icons/small/error.png`;
  - [ ] `canceled` -> `app/assets/images/icons/small/canceled.png`;
  - [ ] `stopped` -> `app/assets/images/icons/small/stopped.png`;
  - [ ] `stopping` -> `app/assets/images/icons/small/stopping.png`;
  - [ ] `waiting` -> `app/assets/images/icons/small/waiting.png`;
  - [ ] `offline` -> `app/assets/images/icons/small/offline.png`.
- [ ] Large icons exist for the same statuses under `app/assets/images/icons/large/*.png`.
- [ ] Online/offline slave icons exist as `small/online.png`, `small/offline.png`, `large/online.png`, and `large/offline.png`.
- [ ] Dashboard slave status text does not currently render online/offline icons; admin slave index does.
- [ ] Stop button uses `icons/small/stopped.png`, not a dedicated stop-action icon.
- [ ] Running build detail footer uses `spinner.gif`, not a status icon.

## Weather Display

- [ ] Weather is stored on `Plan#weather` and rendered in plan list/show views, not directly on the dashboard/build pages.
- [ ] `Plan#update_build_stats!` recalculates weather when a build status changes and the build is finished.
- [ ] Calculation: take up to the 5 newest builds with `finished_at is not null`; count successful/good builds as 1 and failed/bad builds as 0; add `5 - weather_relevant_builds.size` so missing history counts as successful.
- [ ] Example: 2 relevant builds with one success and one failure yields `1 + 3 = 4`.
- [ ] Weather icons exist for `0` through `5` in small and large sizes: `weather-0.png` ... `weather-5.png`.
- [ ] Plan list renders `icons/small/weather-#{plan.weather}.png` with title `%{count} of the last 5 builds were successful`.
- [ ] Plan show renders `icons/large/weather-#{@plan.weather}.png` plus the same localized text.
  > **SPA note:** If React surfaces plan summary/weather next to dashboard or build history, keep the legacy "missing builds count as successful" rule unless product explicitly changes it.
