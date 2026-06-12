# Admin Panel, User Settings, and Help Inventory

Inventory source files:

- `app/controllers/admin/workers_controller.rb`
- `app/controllers/admin/configurations_controller.rb`
- `app/controllers/configurations_controller.rb`
- `app/controllers/help_topics_controller.rb`
- `app/views/admin/workers/*`
- `app/views/admin/configurations/show.html.erb`
- `app/views/configurations/show.html.erb`
- `app/views/config_options/_form.html.erb`
- `app/views/help_topics/show.html.erb`
- `app/views/layouts/application.html.erb`
- `app/models/worker.rb`
- `app/models/config_option.rb`
- `app/models/user/configuration.rb`
- `app/models/help_topic.rb`
- `app/lib/tiny_ci/config.rb`
- `app/lib/tiny_ci/base_config.rb`
- `config/options.yml`
- `config/user_options.yml`
- `config/routes.rb`
- `config/locales/en.yml`
- `config/locales/de.yml`
- `features/manage_workers.feature`
- `features/configuration.feature`
- `features/settings.feature`
- `features/help.feature`

## Cross-Cutting Access, Layout, and Flash Behavior

- [ ] Logged-out users attempting admin worker, admin configuration, or user settings routes are redirected to `/login`, receive `flash.notice.login_required`, and the requested URL is stored in `session[:return_to]`.
- [ ] Authenticated users without an admin capability are redirected to `root_path` with `flash.error.access_denied` rather than receiving a 403.
- [ ] Admin users can access all `can_*?` checks because `Role::Admin#method_missing` returns `true` for any permission predicate.
- [ ] Initial setup admins can configure workers and system variables via `Role::InitialAdmin`, but normal users cannot.
- [ ] The application layout top-right account actions show the current user greeting, `Settings` link to `/settings`, and `Logout` link submitted as `DELETE /logout`.
- [ ] The application layout main navigation always shows `Home`, `All Plans`, `Projects`, `Users`, and `Help`.
- [ ] The `Workers` main navigation item appears only when `current_user.can_configure_workers?`.
- [ ] The `Configuration` main navigation item appears only when `current_user.can_configure_system_variables?`; this is the layout-level link seen by admin/signup flows.
- [ ] The plain layout used for errors/setup has no account actions; outside setup it shows `Home`, `Projects`, `Users`, and `Help`.
- [ ] Flash rendering supports one dismissible message at a time: `flash[:error]` is preferred over `flash[:notice]`.
- [ ] English and German locale keys exist for the navigation and form labels in this area. React should preserve the same i18n keys or provide a deliberate replacement mapping.

> **SPA note:** The Rails authorization behavior is redirect-and-flash based, not API-status based. A React migration should decide whether admin-only API calls return 401/403 while preserving the user-facing redirect and message behavior.

## `GET /admin/workers`

- [ ] Controller action: `Admin::WorkersController#index`, gated by `require_user` and `can_configure_workers!`.
- [ ] Loads every worker with `@workers = Worker.all`; there is no explicit sorting or pagination.
- [ ] Empty state text: `There are no workers configured yet.`
- [ ] Empty state action: link `Add the first worker` to `new_admin_worker_path`.
- [ ] Empty state quick-create form posts a hidden worker with `name=localhost` and `protocol=localhost`; submit label is `Use localhost as the first worker`.
- [ ] Non-empty state renders a table with columns `Status`, `Protocol`, `Name`, and `Hostname`.
- [ ] Status column renders `icons/small/offline.png` plus `Offline` when `worker.offline` is truthy.
- [ ] Status column renders `icons/small/online.png` plus `Online` otherwise.
- [ ] Protocol column renders the raw `worker.protocol`.
- [ ] Name column links to `GET /admin/workers/:name`; worker URLs use the unique worker name, not numeric ID.
- [ ] Hostname column renders the raw `worker.hostname`.
- [ ] The only row-level action on the index is the linked worker name; edit, clone, and delete are available from the show page.
- [ ] The page footer action links `New Worker` to `GET /admin/workers/new`.
- [ ] Cucumber coverage verifies that an online `localhost` and offline `foreignhost` appear with `Online` and `Offline`.

## `GET /admin/workers/:id`

- [ ] Controller action: `Admin::WorkersController#show`, gated by `require_user` and `can_configure_workers!`.
- [ ] Finds by `Worker.from_param!(params[:id])`, which calls `find_by!(name: param)`.
- [ ] Heading: `Worker %{name}`.
- [ ] Action list includes `Edit`, `Clone`, and `Delete`.
- [ ] `Edit` links to `GET /admin/workers/:name/edit`.
- [ ] `Clone` links to `GET /admin/workers/new?clone=:name`.
- [ ] `Delete` submits `DELETE /admin/workers/:name` with confirmation text `Do you really want to delete this worker? This operation can not be undone.`
- [ ] Detail fields displayed are `Offline`, `Protocol`, `Host name`, `Busy?`, and `Capabilities`.
- [ ] Offline display is textual `Yes` or `No`; the show page does not use online/offline icon images.
- [ ] `Busy?` displays `@worker.busy?.inspect`, so the UI currently shows literal `true` or `false`.
- [ ] The show page does not display username, password, base path, environment variables, maximum builds, current running builds, current build names, or a current build link.
- [ ] The page includes a `Workers Overview` link back to `/admin/workers`.

> **SPA note:** The issue asks for a current-build display on the worker show page, but the current Rails show page only exposes `Busy?`. Running builds are rendered on the dashboard worker-status partial, not here. Treat current-build detail as a new SPA/API requirement if it is desired.

## `GET /admin/workers/new`

- [ ] Controller action: `Admin::WorkersController#new`, gated by `require_user` and `can_configure_workers!`.
- [ ] Without `clone`, initializes a blank `Worker.new`.
- [ ] Heading: `New Worker`.
- [ ] Form posts to `POST /admin/workers`.
- [ ] Submit label: `Create`.
- [ ] Validation errors render through legacy `f.error_messages`.
- [ ] Required model validations are `name` presence, `name` uniqueness, and `protocol` presence.
- [ ] The form has an `Offline` checkbox.
- [ ] The form has `Name` text field bound to `worker[name]`.
- [ ] The form has `Protocol` select bound to `worker[protocol]` with exactly two options: `localhost` and `ssh`.
- [ ] The form has `Host Name` text field bound to `worker[hostname]`.
- [ ] The form has `User Name` text field bound to `worker[username]`; the UI label is not `login`.
- [ ] The form has `Password` text field bound to `worker[password]`; the model encrypts this field.
- [ ] The form has `Base Path` text field bound to `worker[base_path]`, using `@worker.base_path(:skip_default)` as the visible value.
- [ ] Base path help text says leaving it blank uses the default `@worker.default_base_path`, which comes from `TinyCI::Config.base_path`.
- [ ] The form has an environment variables table with `Variable name` and `Value` text fields.
- [ ] Existing environment variables are sorted and rendered, then one blank row is appended for adding a new variable.
- [ ] Blank environment-variable keys are removed by `Worker#cleanup_environment` before save.
- [ ] The form has `Worker capabilities` textarea with 3 rows and a help link to `/help_topics/workers`.
- [ ] Capabilities help text says values are separated by commas.
- [ ] The form has `Maximum builds` text field bound to `worker[max_builds]`.
- [ ] Maximum builds help text says `0 = unlimited`; schema default is `0`.
- [ ] There are no current form fields for port, SSH key path, timeout, or separate login name beyond `username`.
- [ ] The protocol select does not dynamically hide or require other fields. Both `localhost` and `ssh` show hostname, username, password, base path, environment variables, capabilities, and maximum builds.
- [ ] Cucumber coverage verifies creating a worker by filling only `name` and pressing `Create`.

> **SPA note:** Protocol-specific conditional fields are not implemented in the current Rails UI. If React hides SSH fields for `localhost` or enforces required fields for `ssh`, that would be new behavior and should be coordinated with backend validations.

## `GET /admin/workers/new?clone=:name`

- [ ] Controller action: `Admin::WorkersController#new` calls `Worker.find_for_cloning!(params[:clone])`.
- [ ] Clone lookup uses the source worker name.
- [ ] Clone copies the source worker object attributes, including protocol, hostname, username, encrypted password value, base path, environment variables, offline flag, capabilities, and maximum builds.
- [ ] Clone clears `id`.
- [ ] Clone clears `name`.
- [ ] Clone sets `@new_record` to true so the form submits a create rather than an update.
- [ ] The user must enter a unique name before saving because `Worker` validates name uniqueness.
- [ ] Cucumber coverage verifies following `Clone`, entering `clone_worker`, pressing `Create`, and seeing the cloned worker.

## `POST /admin/workers`

- [ ] Controller action: `Admin::WorkersController#create`, gated by `require_user` and `can_configure_workers!`.
- [ ] Strong parameters permit `protocol`, `name`, `hostname`, `username`, `password`, `base_path`, `offline`, `capabilities`, `max_builds`, and `environment_variables`.
- [ ] `environment_variables` is permitted as a hash and coerced to a plain Hash in `Worker#environment_variables=`.
- [ ] On successful save, sets `flash.notice.created_worker` (`Successfully created worker`) and redirects to `GET /admin/workers/:name`.
- [ ] On validation failure, renders `new` with HTTP 422.

## `GET /admin/workers/:id/edit`

- [ ] Controller action: `Admin::WorkersController#edit`, gated by `require_user` and `can_configure_workers!`.
- [ ] Finds by worker name via `Worker.from_param!`.
- [ ] Heading: `Edit Worker %{name}`.
- [ ] Form fields are identical to the new worker form.
- [ ] Submit label: `Update`.
- [ ] Cucumber coverage verifies changing `protocol` to `ssh` and seeing `ssh` after update.

## `PATCH/PUT /admin/workers/:id`

- [ ] Controller action: `Admin::WorkersController#update`, gated by `require_user` and `can_configure_workers!`.
- [ ] Uses the same strong-parameter allowlist as create.
- [ ] On successful update, sets `flash.notice.updated_worker` (`Successfully updated worker`) and redirects to `GET /admin/workers/:name`.
- [ ] On validation failure, renders `edit` with HTTP 422.

## `DELETE /admin/workers/:id`

- [ ] Controller action: `Admin::WorkersController#destroy`, gated by `require_user` and `can_configure_workers!`.
- [ ] Finds by worker name via `Worker.from_param!`.
- [ ] Calls `@worker.destroy` unconditionally.
- [ ] On destroy, sets `flash.notice.deleted_worker` (`Successfully deleted worker`) and redirects to `/admin/workers`.
- [ ] There is no guard preventing deletion of a worker with running builds.
- [ ] `Worker has_many :builds, dependent: :nullify`, so deleting a worker nulls existing build `worker_id` references instead of deleting builds.
- [ ] Cucumber coverage verifies deleting a worker removes it from the workers page.

> **SPA note:** The delete confirmation is client-side only. A React implementation should still treat the backend as allowing deletion of busy workers unless a new backend guard/API contract is added.

## `GET /admin/configuration`

- [ ] Controller action: `Admin::ConfigurationsController#show`, gated by `require_user` and `can_configure_system_variables!`.
- [ ] Loads `@config = TinyCI::Config.instance`.
- [ ] Renders a single form for `:config` posted to `admin_configuration_path`.
- [ ] Submit label: `Update`.
- [ ] The form body is shared with user settings via `app/views/config_options/_form.html.erb`.
- [ ] Options come from `config/options.yml` through `TinyCI::BaseConfig#options`.
- [ ] Each option has a key, localized or literal name, optional localized or literal description, type, default, and optional `values`.
- [ ] `Hash` options are skipped by the shared form partial.
- [ ] Options with `values` render as a select.
- [ ] Options without `values` render as a text field, including `Integer` options.
- [ ] Current stored values come from `config_options` rows with `user_id = nil`; absent rows fall back to YAML defaults.
- [ ] The rendered admin options are `language`, `base_path`, `site_root`, `email_sender_address`, `email_address`, `email_port`, `email_domain`, `email_user_name`, `email_password`, and `email_authentication`.
- [ ] `language` is a select with values `en` and `de`.
- [ ] `base_path` is a text field; default is `<ENV['HOME']>/tiny_ci`.
- [ ] `environment` exists in `config/options.yml` as a `Hash` with default `CI_SERVER: TinyCI`, but it is not rendered by the current form.
- [ ] `site_root` is a text field; default is `localhost:7199`.
- [ ] `email_sender_address` is a text field; default is `tiny_ci@example.com`.
- [ ] `email_address` is a text field; default is `example.com`.
- [ ] `email_port` is a text field type-cast as Integer by the config layer; default is `25`.
- [ ] `email_domain` is a text field; default is `localhost`.
- [ ] `email_user_name` is a text field; default is `tiny_ci@imedo.de`.
- [ ] `email_password` is a text field; default is `password`.
- [ ] `email_authentication` is a select with values `plain`, `login`, and `cram_md5`; default is `login`.
- [ ] Cucumber coverage verifies filling `config_base_path`, pressing `Update`, and seeing the updated value in the field.

> **SPA note:** Admin configuration is metadata-driven by `config/options.yml`, not hard-coded in the view. React should consume equivalent option metadata or duplicate the same key/type/value rules intentionally. The current Rails form does not render `Hash` options.

## `POST /admin/configuration`

- [ ] Controller action: `Admin::ConfigurationsController#create`, gated by `require_user` and `can_configure_system_variables!`.
- [ ] The Rails resource also defines PATCH/PUT routes, but the controller implements `create` and the current form submits POST.
- [ ] Calls `TinyCI::Config.instance.update(params[:config].to_unsafe_h)`.
- [ ] Updates are not strong-parameter filtered; each submitted config key is passed to `TinyCI::BaseConfig#set`.
- [ ] `TinyCI::BaseConfig#set` looks up option metadata by key, type-casts by option type, and writes YAML serialized values to `ConfigOption`.
- [ ] Type casting supports `String`, `Integer`, and `Hash`.
- [ ] On update, sets `flash.notice.updated_configuration` (`Successfully updated configuration`) and redirects to `/admin/configuration`.
- [ ] There is no validation-error branch; `update` always returns true.

## `GET /settings`

- [ ] Controller action: `ConfigurationsController#show`, gated by `require_user`.
- [ ] Loads `@config = current_user.config`, an instance of `User::Configuration`.
- [ ] `User::Configuration` inherits `TinyCI::BaseConfig` and sets `@user_id` to the current user's ID.
- [ ] Uses the same shared config option form partial as admin configuration.
- [ ] Options come from `config/user_options.yml`, not `config/options.yml`.
- [ ] Current stored values come from `config_options` rows scoped to the current user's `user_id`.
- [ ] The only per-user option currently defined is `growl_host`.
- [ ] `growl_host` label is `Growl Host`.
- [ ] `growl_host` description is `The host name / IP Address of your local machine for Growl notifications.`
- [ ] `growl_host` type is `String`.
- [ ] `growl_host` has no default and no `values`, so it renders as a text field.
- [ ] Submit label: `Update`.
- [ ] Cucumber coverage verifies a logged-in user can set `Growl Host` to `localhost`, sees `Successfully updated configuration`, and the field retains `localhost`.

> **SPA note:** User settings are metadata-driven by `config/user_options.yml`. The React settings screen should not assume the single Growl Host field is permanent unless the migration intentionally freezes this schema.

## `POST /settings`

- [ ] Controller action: `ConfigurationsController#create`, gated by `require_user`.
- [ ] The Rails singular resource also defines PATCH/PUT routes, but the controller implements `create` and the current form submits POST.
- [ ] Calls `current_user.config.update(params[:config].to_unsafe_h)`.
- [ ] Updates are not strong-parameter filtered; each submitted config key is passed to `TinyCI::BaseConfig#set`.
- [ ] Values are stored as YAML in `ConfigOption` rows scoped to the current user.
- [ ] On update, sets `flash.notice.updated_configuration` (`Successfully updated configuration`) and redirects to `/settings`.
- [ ] There is no validation-error branch; `update` always returns true.

## Shared Config Option Form Partial

- [ ] Iterates `config.options` in YAML order.
- [ ] Skips options with `option.type == 'Hash'`.
- [ ] Wraps each rendered option in `<p class="form_item">`.
- [ ] For localized names, uses `option.name[I18n.locale.to_s]`.
- [ ] For literal names, uses `option.name` directly.
- [ ] For localized descriptions, uses `option.description[I18n.locale.to_s]`.
- [ ] For literal descriptions, uses `option.description` directly.
- [ ] Descriptions are optional.
- [ ] Options with a `values` array render `f.select option.key, option.values`.
- [ ] Options without `values` render `f.text_field option.key`.
- [ ] There is no special password field, number input, checkbox, dynamic dependency logic, or client-side validation in this partial.

## `GET /help_topics`

- [ ] Route maps to `HelpTopicsController#index`.
- [ ] The index action calls `show` and then renders `show`.
- [ ] With no `params[:id]`, `HelpTopic.from_param!` loads the `index` topic.
- [ ] The backing file is `doc/help_topics/index.textile`.
- [ ] The page does not list available topics dynamically.
- [ ] The visible template is `app/views/help_topics/show.html.erb`.
- [ ] It renders the topic title in `<h2>`.
- [ ] It renders Textile body content in `<div class="help-content">`.

## `GET /help_topics/*id`

- [ ] Route maps to `HelpTopicsController#show` and captures nested IDs such as `plan/chain`.
- [ ] `HelpTopic.from_param!` joins array params with `/` and falls back to `index` for blank IDs.
- [ ] Help topic files are loaded from `doc/help_topics/#{topic}.textile`.
- [ ] The first line of the Textile file is the topic title.
- [ ] Remaining lines are joined as the body text.
- [ ] Missing files raise `Errno::ENOENT`, which is handled by rendering `errors/404` with status 404 and plain layout.
- [ ] Body text is rendered through `RedCloth.new(...).to_html.html_safe`.
- [ ] The helper rewrites Textile links like `":workers` to `":/help_topics/workers`.
- [ ] The helper preserves external `http` links when the matched link target is `http`.
- [ ] `help_link(topic_name)` renders localized `navigation.help` text pointing at `help_topic_path(topic_name)`.
- [ ] Existing topic files include `about`, `index`, `plan`, `plan/chain`, `plan/child`, `project`, `workers`, `test`, and `users`.
- [ ] Cucumber coverage verifies loading topic `test` shows `Test Page`.

> **SPA note:** Help topics are filesystem-backed Textile documents, not database rows. A React migration needs either an endpoint that renders/sanitizes Textile HTML server-side or a build/runtime content pipeline that preserves wildcard nested topic IDs and 404 behavior.

## Locale Keys Used In This Area

- [ ] Admin configuration: `admin.configurations.show.update`.
- [ ] Admin worker edit: `admin.workers.edit.edit_worker`, `admin.workers.edit.update`.
- [ ] Admin worker form: `admin.workers.form.base_path`, `base_path_description`, `capabilities_description`, `host_name`, `max_builds_description`, `maximum_builds`, `name`, `offline`, `password`, `protocol`, `worker_capabilities`, `user_name`, `value`, `variable_name`.
- [ ] Admin worker index: `admin.workers.index.add_the_first_worker`, `hostname`, `listing_workers`, `name`, `new_worker`, `offline`, `online`, `or`, `protocol`, `status`, `there_are_no_workers_configured_yet`, `use_localhost_as_the_first_worker`.
- [ ] Admin worker new: `admin.workers.new.create`, `admin.workers.new.new_worker`.
- [ ] Admin worker show: `admin.workers.show.busy`, `capabilities`, `clone`, `delete`, `delete_confirmation`, `edit`, `host_name`, `no`, `offline`, `protocol`, `worker_name`, `workers_overview`, `yes`.
- [ ] User settings: `configurations.show.update`.
- [ ] Flash messages: `flash.error.access_denied`, `flash.notice.login_required`, `flash.notice.created_worker`, `flash.notice.updated_worker`, `flash.notice.deleted_worker`, `flash.notice.updated_configuration`.
- [ ] Layout keys: `layouts.all_plans`, `close_flash`, `configuration`, `github_project_page`, `guest_greeter`, `help`, `home`, `login`, `logout`, `projects`, `quick_links`, `report_bugs_html`, `report_link_text`, `settings`, `setup`, `signup`, `workers`, `subtitle`, `user_greeter`, `users`, `you_are_here_html`.
- [ ] Help link key: `navigation.help`.
- [ ] Breadcrumb keys relevant to this area: `breadcrumb.admin`, `breadcrumb.configuration`, `breadcrumb.edit`, `breadcrumb.help_topics`, `breadcrumb.home`, `breadcrumb.new`, `breadcrumb.settings`, `breadcrumb.workers`.

