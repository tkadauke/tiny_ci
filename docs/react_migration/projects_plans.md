# Projects, Plans, and Manual Build Triggering

Inventory source: `ProjectsController`, `PlansController`, `BuildsController`, project/plan/build models, project/plan views, `PlansHelper`, config option form, locale files, and Cucumber features for project/plan management, plan lists, plan overview, chained plans, and child plans.

## Cross-Cutting Access And State

- [ ] Preserve route gates:
  - Project index/show are public.
  - Project new/create and edit/update require `can_create_projects?` / `can_edit_projects?`; normal logged-in users and admins pass.
  - All plan routes require login through `require_user`.
  - Plan new/create require `can_create_plans?`; plan edit/update require `can_edit_plans?`; plan destroy requires `can_destroy_plans?`. In current roles, admins and the initial admin pass, normal users do not.
  - Plan show action links use singular checks (`can_edit_plan?`, `can_destroy_plan?`), which admins/initial admins pass.
  - Manual build creation (`POST /projects/:project_id/plans/:plan_id/builds`) requires login but has no admin-only check.
- [ ] Keep login redirects and flash behavior: unauthenticated plan/build access stores the requested URL, redirects to `/login`, and flashes `You must be logged in to access this page`.
- [ ] Keep access-denied behavior for failed role checks: redirect to root with `Access denied`.
- [ ] Use name-based URLs for projects and plans (`to_param` returns the persisted name); renaming changes URLs.
- [ ] Keep validation rules:
  - Project `name`: required, unique, format `a-z`, `A-Z`, `0-9`, `_`, `-`.
  - Plan `name`: required, unique per project, same format.
  - Plan `project_id`: required.
  - Build `plan_id`: required.
- [ ] Preserve form validation rendering: failed create/update re-renders the same form with HTTP 422 and `f.error_messages` output listing full validation messages.
- [ ] Preserve locale keys for English and German in this area: project labels/actions, plan labels/actions, flash notices/errors, build status labels, and build detail labels.

## `GET /projects` - Projects Index

- [ ] Render heading `Listing Projects`.
- [ ] Render a table with columns:
  - `Name`: project name links to the project's plans list (`/projects/:project_id/plans`).
  - `Description`: project description truncated to 40 characters.
  - `Options`: `Edit` link to `/projects/:id/edit`.
- [ ] Empty state is an empty table body; there is no explicit "no projects" message.
- [ ] Show `New Project` link only when `current_user.can_create_projects?`.
- [ ] `GET /projects/:id` immediately redirects to the same project's plans list.

## `GET /projects/new`, `POST /projects` - New Project

- [ ] Gate both routes with `can_create_projects?`.
- [ ] Render heading `New Project`.
- [ ] Form fields:
  - `name` text field.
  - Name description: name appears in URL, renames change URLs, only letters, numbers, underscores, and dashes.
  - `description` textarea with 5 rows.
- [ ] Submit label is `Create`.
- [ ] On success, flash `Successfully created project` and redirect to `/projects`.
- [ ] On validation failure, re-render the new form with error messages and status 422.

## `GET /projects/:id/edit`, `PUT/PATCH /projects/:id` - Edit Project

- [ ] Gate both routes with `can_edit_projects?`.
- [ ] Render heading `Edit Project %{name}`.
- [ ] Reuse the project form fields from new.
- [ ] Submit label is `Update`.
- [ ] On success, flash `Successfully updated project` and redirect to `/projects`.
- [ ] On validation failure, re-render the edit form with error messages and status 422.

## `GET /plans` - All Plans List

- [ ] Require login.
- [ ] Render heading `Listing All Plans`.
- [ ] Support report toggle links:
  - `Details`: `/plans?report=list`.
  - `Overview`: `/plans?report=overview`.
- [ ] Default report is `list`.
- [ ] Query all plans with their projects and sort by `projects.name asc, plans.name asc`.
- [ ] The list is not visually grouped into project sections; grouping is represented by project-first sorting and each row's `Project / Plan` display.
- [ ] Details report rows show:
  - Current status icon when `plan.status` is present.
  - Weather icon when `plan.weather` is present, title `%{count} of the last 5 builds were successful`.
  - `Project / Plan` links: project link goes through `project_path` and redirects to its plan list; plan link goes to plan show.
  - Description truncated to 40 characters.
  - Last build time, formatted with `duration`, or `unknown`.
  - Last success as `%{time} ago` or `unknown`.
  - Last failure as `%{time} ago` or `unknown`.
- [ ] Overview report renders large status icons plus plan name link and project name link in parentheses.
- [ ] Empty state is an empty table/list; there is no explicit "no plans" message.
- [ ] Subscribe to Turbo stream `"queue"` and morph-refresh the plan list preserving scroll.
  > **SPA note:** The React equivalent should update list/overview status, weather, and timestamps from a build queue/status event stream or polling source without losing scroll position.
- [ ] XHR requests render only the selected report partial (`list` or `overview`).
  > **SPA note:** Treat report changes as in-page view state that can also be deep-linked with `?report=`.

## `GET /projects/:project_id/plans` - Project Plans List

- [ ] Require login.
- [ ] Render heading `Listing Plans`.
- [ ] Support the same Details/Overview report toggle as `/plans`, scoped to the project.
- [ ] Query only root plans for the project (`parent_id is null`); child plans appear under their parent on plan show, not in this index.
- [ ] Show `New Plan` link only when `current_user.can_create_plans?`.
- [ ] Use the same list and overview partials, including project/plan links, status icons, weather, last build time, last success, and last failure.
- [ ] Subscribe to Turbo stream `"queue"` and morph-refresh preserving scroll.
  > **SPA note:** Same live update behavior as `/plans`, but scoped to the current project's root plans.

## `GET /projects/:project_id/plans/new`, `POST /projects/:project_id/plans` - New Plan

- [ ] Require login and `can_create_plans?`.
- [ ] Render heading `New Plan`.
- [ ] Support normal creation, clone creation, and child creation:
  - Normal: `Plan.new`.
  - Clone: `?clone=:plan_name` loads the source plan by name globally, clears `id` and `name`, marks it as new, and pre-fills other form fields that are rendered.
  - Child: `?parent=:plan_name` creates a new unsaved plan with `parent` set from the named plan.
- [ ] Form fields:
  - Hidden `parent_id`.
  - `name` text field with URL/allowed-character description.
  - `description` textarea with 5 rows.
  - `repository_url` text field.
  - `steps` textarea with 10 rows and plan help link.
  - `requirements` textarea with 3 rows and slaves help link.
  - `previous_plan_id` select under `Run this plan after`, only when the plan has no parent.
- [ ] `previous_plan_id` select options are the project's root plans except the current plan, with a blank option.
- [ ] Submit label is `Create`.
- [ ] On success, flash `Successfully created plan` and redirect to the plan show page.
- [ ] On validation failure, re-render new with errors and status 422.
- [ ] Steps editing/creation must remain admin-only by route gate because plan steps are Ruby DSL source and remain an RCE-sensitive surface even with the validator.
- [ ] There are no plan-form environment override fields in the current UI. Environment can be affected by manual build POST parameters, global/slave config, and the plan steps DSL `env`.
- [ ] The shared `config_options` form is not rendered on plan pages today.

## `GET /projects/:project_id/plans/:id/edit`, `PUT/PATCH /projects/:project_id/plans/:id` - Edit Plan

- [ ] Require login and `can_edit_plans?`.
- [ ] Render heading `Edit Plan %{name}`.
- [ ] Reuse the plan form from new, including hidden `parent_id`, description, repository URL, steps, requirements, and `previous_plan_id` for standalone/root plans.
- [ ] Submit label is `Update`.
- [ ] On success, flash `Successfully updated plan` and redirect to plan show.
- [ ] On validation failure, re-render edit with errors and status 422.
- [ ] If a plan has a parent, model callback clears both `previous` and `next` chain links before update; child plans cannot remain in a sequential build chain.
- [ ] Keep steps editing behind admin/initial-admin permissions due to the steps DSL execution risk.

## `GET /projects/:project_id/plans/:id` - Plan Show / Overview

- [ ] Require login.
- [ ] Render heading `Plan %{name}`.
- [ ] If the plan is a child, append `(child of %{parent_plan})` where parent links to parent plan show.
- [ ] Action list:
  - `Edit`, only when `current_user.can_edit_plan?(@plan)`.
  - `Builds`, always for logged-in viewers.
  - `Clone`, only when `current_user.can_create_plans?`.
  - For child plans, `Move to another Parent` and `Convert to Standalone Plan`, only when `can_edit_plan?`.
  - For standalone plans, `New Child Plan`, only when `can_create_plans?`.
  - For standalone plans with no children, `Convert to Child Plan`, only when `can_edit_plan?`.
  - `Delete`, only when `can_destroy_plan?`.
- [ ] Clone link goes to new plan with `?clone=@plan`; copied rendered fields include description, repository URL, steps, requirements, parent id, and previous plan id. Name is intentionally blank. Build stats/status/builds are not submitted by the form and are not copied to the saved clone.
- [ ] Delete link uses HTTP DELETE with confirmation text `Do you really want to delete this plan and all its children and builds? This operation can not be undone.`
  > **SPA note:** Use an explicit confirmation modal/dialog and issue a DELETE request; do not rely on anchor `data-method`.
- [ ] Delete redirects to the project plans list. Model associations delete all builds for the plan. Because `acts_as_tree` is used and the confirmation says children are deleted, verify child cascade behavior during implementation/testing instead of assuming a soft delete.
- [ ] Build chain section appears only when `@plan.previous` or `@plan.next` exists.
- [ ] Build chain display is a one-row table: previous plan link, current plan name, next plan link.
- [ ] Children section appears only when the plan has children and renders the standard plan details list for `@plan.children`.
- [ ] Plan details display:
  - Status row only when `@plan.status` is present: large status icon, localized build status label, and `Latest Build` link to `@plan.last_finished_build`.
  - Weather row only when `@plan.weather` is present: large weather icon and `%{count} of the last 5 builds were successful`.
  - Description rendered through `simple_format`.
  - Steps in a `<pre>`.
  - Requirements text, preserving an empty row with `&nbsp;`.
- [ ] Latest build stats come from `Plan#update_build_stats!`: weather is successes among last 5 finished builds plus missing builds counted as successful; status/last build time/last success/last failure come from finished build associations.
- [ ] Standalone plans show a Commit Hook section:
  - URL field containing `project_plan_builds_url`.
  - wget command field posting empty data to that URL.
  - curl command field posting empty data to that URL.
- [ ] Standalone plans show `Build now` button posting to `/projects/:project_id/plans/:plan_id/builds`.
- [ ] Child plans do not show `Build now`; they show `Back to parent plan %{parent}`.
- [ ] Always show `Back to project %{link}`.
- [ ] Status/weather/build links are updated indirectly by Turbo queue refreshes on list pages, not by a plan-show Turbo stream.

## `POST /projects/:project_id/plans/:plan_id/builds` - Build Now / Manual Trigger

- [ ] Require login; any logged-in user can trigger a build.
- [ ] Create a build through `@plan.build!` with:
  - `status: "pending"`.
  - `starter: current_user.to_user`.
  - `parameters`: all request params except `controller`, `action`, `plan_id`, `project_id`, and `authenticity_token`.
- [ ] Flash `Building plan %{name}`.
- [ ] Redirect to the new build show page.
- [ ] Build show displays the starter login when present: link to user plus `(Requested manually)`.
- [ ] This is where the user's login name appears after a manual build.
- [ ] Build creation broadcasts a Turbo refresh to `"queue"` after commit.
  > **SPA note:** The React build button should submit a POST, show the flash/toast, navigate to the created build page, and let queue/list subscribers refresh from the build event.
- [ ] Manual build parameters are used as the build environment (`Build#environment`). Child builds inherit the parent build environment when spawned.

## `GET /projects/:project_id/plans/:id/child` - Convert / Move Parent Form

- [ ] Require login through the plans controller and require edit permission by the eventual update route.
- [ ] Render heading `Select parent plan for %{plan}`.
- [ ] Render a form for the existing plan with one select:
  - Label text is `Select Parent Plan`.
  - Field is `plan_parent_id`.
  - Options are the project's root plans except the current plan, plus a blank option.
- [ ] Submit label is `Update`.
- [ ] This same form supports:
  - Convert standalone plan to child plan.
  - Move child plan to another parent.
  - Clearing parent by selecting blank, though the show page also provides a direct standalone conversion link.
- [ ] On update, redirect back to plan show with `Successfully updated plan`.

## Child Plan Flows

- [ ] New Child Plan:
  - Link appears on standalone plans only, for users with create-plan permission.
  - Link opens new plan form with `?parent=@plan`.
  - Hidden `parent_id` is prefilled.
  - Because the plan has a parent, the `previous_plan_id` chaining select is hidden.
  - Created child show page displays `(child of parent_name)`.
- [ ] Convert to Child Plan:
  - Link appears only for standalone plans with no children and edit permission.
  - Link opens the child route form.
  - Parent select includes project root plans except the current plan.
  - Saving `parent_id` makes the show heading display `(child of parent_name)`.
  - Model callback clears chain links when a parent is present.
- [ ] Convert to Standalone Plan:
  - Link appears only for child plans with edit permission.
  - Current implementation uses a PUT link with `plan[parent_id]=nil`.
  - Saving clears `parent_id`; the show page no longer displays parent heading/back link and instead displays standalone actions and Build now/Commit Hook.
  > **SPA note:** Replace Rails method-link behavior with an explicit update request that sets `parent_id` to `null`, then update route state/UI from the response.
- [ ] Move to Another Parent:
  - Link appears only for child plans with edit permission.
  - Opens the child route form.
  - Select options are root plans in the same project except the current child plan.
  - Saving changes the parent shown in the plan heading.

## Chained Plan Flow

- [ ] Chaining is configured through `previous_plan_id` on the standalone/root plan form.
- [ ] Select options are root plans in the same project except the current plan, with a blank option.
- [ ] After saving, plan show displays `Build chain`.
- [ ] The chain row shows previous plan, current plan, and next plan when each exists.
- [ ] Build execution calls `plan.build_next!(build)` when a build succeeds, creating a pending child-linked build on the next plan through `build_with_parent_build!`.
- [ ] Child plans cannot remain chained; updating a plan with `parent_id` clears previous/next links.

## `GET /projects/:project_id/plans/:plan_id/builds` - Build History Summary

- [ ] Require login.
- [ ] Query builds for the plan ordered by newest `created_at` first and include child builds.
- [ ] Render `No builds` when empty.
- [ ] Otherwise render table columns:
  - Number: build position link.
  - Name: `Project / Plan` links.
  - Timestamp: build creation timestamp link.
  - Status: status icon plus localized status.
  - Stop action for unfinished builds.
- [ ] Child builds render as additional rows under the parent with `+` before the child build number.
- [ ] Stop buttons use POST to `/stop` and XHR can return `200 OK`.
  > **SPA note:** Preserve nested child-build rows and live refresh from the queue stream; use POST actions for stop/build rather than method-emulated anchors.

## Plan-Level Config Options And Environment

- [ ] There are no plan-level `ConfigOption` records or plan-page config option form in the current implementation.
- [ ] The shared `app/views/config_options/_form.html.erb` is used by:
  - User settings (`/settings`) with `current_user.config`.
  - Admin configuration (`/admin/configuration`) with `TinyCI::Config.instance`.
- [ ] The config options partial iterates `config.options`, skips options where `type == "Hash"`, and renders:
  - Label from localized hash (`option.name[I18n.locale]`) or plain string.
  - Optional description from localized hash or plain string.
  - Select field when `option.values` exists.
  - Text field otherwise.
- [ ] System options in `config/options.yml`:
  - `language`: select `en`/`de`.
  - `base_path`: string.
  - `environment`: Hash default `{ CI_SERVER: TinyCI }`, skipped by the shared form.
  - `site_root`: string.
  - `email_sender_address`: string.
  - `email_address`: string.
  - `email_port`: integer.
  - `email_domain`: string.
  - `email_user_name`: string.
  - `email_password`: string.
  - `email_authentication`: select `plain`/`login`/`cram_md5`.
- [ ] User options in `config/user_options.yml`:
  - `growl_host`: string.
- [ ] Config values save through `TinyCI::BaseConfig#update`, which writes YAML-serialized values to `config_options` by `key` and optional `user_id`.
- [ ] Global build environment comes from `TinyCI::Config.environment`, but the Hash option is skipped in the current config form.
- [ ] Slave-level environment variables are configured on slave forms and merge over global environment.
- [ ] Build-level environment overrides come from manual build POST parameters and the plan DSL `env` method, then merge into command execution.

## Turbo / Remote Behavior To Preserve

- [ ] Plan list pages (`/plans`, project plan index) subscribe to `"queue"` and morph-refresh with scroll preservation.
- [ ] Build index subscribes to `"queue"` and morph-refreshes.
- [ ] Build show subscribes to `"build_#{@build.name}_#{@build.position}"` and morph-refreshes while unfinished.
- [ ] Build model broadcasts queue refresh on create and queue/build refreshes on status/output updates.
- [ ] Plans controller supports XHR partial responses for index/full index reports.
- [ ] Builds controller supports XHR partial responses for build index/show and XHR `200 OK` for stop.
- [ ] Rails method links exist for delete plan, convert to standalone, and stop/build button POSTs.
  > **SPA note:** Implement these as explicit HTTP mutations with optimistic/disabled pending states, confirmation where required, and event-driven refresh of affected plan/build lists.
