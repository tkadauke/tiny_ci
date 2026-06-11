# Admin Panel, User Settings, and Help Inventory

Inventory source files:

- `app/controllers/admin/slaves_controller.rb`
- `app/controllers/admin/configurations_controller.rb`
- `app/controllers/configurations_controller.rb`
- `app/controllers/help_topics_controller.rb`
- `app/views/admin/slaves/*`
- `app/views/admin/configurations/show.html.erb`
- `app/views/configurations/show.html.erb`
- `app/views/config_options/_form.html.erb`
- `app/views/help_topics/show.html.erb`
- `app/views/layouts/application.html.erb`
- `app/models/slave.rb`
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
- `features/manage_slaves.feature`
- `features/configuration.feature`
- `features/settings.feature`
- `features/help.feature`

## Cross-Cutting Access, Layout, and Flash Behavior

- [ ] Logged-out users attempting admin slave, admin configuration, or user settings routes are redirected to `/login`, receive `flash.notice.login_required`, and the requested URL is stored in `session[:return_to]`.
- [ ] Authenticated users without an admin capability are redirected to `root_path` with `flash.error.access_denied` rather than receiving a 403.
- [ ] Admin users can access all `can_*?` checks because `Role::Admin#method_missing` returns `true` for any permission predicate.
- [ ] Initial setup admins can configure slaves and system variables via `Role::InitialAdmin`, but normal users cannot.
- [ ] The application layout top-right account actions show the current user greeting, `Settings` link to `/settings`, and `Logout` link submitted as `DELETE /logout`.
- [ ] The application layout main navigation always shows `Home`, `All Plans`, `Projects`, `Users`, and `Help`.
- [ ] The `Slaves` main navigation item appears only when `current_user.can_configure_slaves?`.
- [ ] The `Configuration` main navigation item appears only when `current_user.can_configure_system_variables?`; this is the layout-level link seen by admin/signup flows.
- [ ] The plain layout used for errors/setup has no account actions; outside setup it shows `Home`, `Projects`, `Users`, and `Help`.
- [ ] Flash rendering supports one dismissible message at a time: `flash[:error]` is preferred over `flash[:notice]`.
- [ ] English and German locale keys exist for the navigation and form labels in this area. React should preserve the same i18n keys or provide a deliberate replacement mapping.

> **SPA note:** The Rails authorization behavior is redirect-and-flash based, not API-status based. A React migration should decide whether admin-only API calls return 401/403 while preserving the user-facing redirect and message behavior.

## `GET /admin/slaves`

- [ ] Controller action: `Admin::SlavesController#index`, gated by `require_user` and `can_configure_slaves!`.
- [ ] Loads every slave with `@slaves = Slave.all`; there is no explicit sorting or pagination.
- [ ] Empty state text: `There are no slaves configured yet.`
- [ ] Empty state action: link `Add the first slave` to `new_admin_slave_path`.
- [ ] Empty state quick-create form posts a hidden slave with `name=localhost` and `protocol=localhost`; submit label is `Use localhost as the first slave`.
- [ ] Non-empty state renders a table with columns `Status`, `Protocol`, `Name`, and `Hostname`.
- [ ] Status column renders `icons/small/offline.png` plus `Offline` when `slave.offline` is truthy.
- [ ] Status column renders `icons/small/online.png` plus `Online` otherwise.
- [ ] Protocol column renders the raw `slave.protocol`.
- [ ] Name column links to `GET /admin/slaves/:name`; slave URLs use the unique slave name, not numeric ID.
- [ ] Hostname column renders the raw `slave.hostname`.
- [ ] The only row-level action on the index is the linked slave name; edit, clone, and delete are available from the show page.
- [ ] The page footer action links `New Slave` to `GET /admin/slaves/new`.
- [ ] Cucumber coverage verifies that an online `localhost` and offline `foreignhost` appear with `Online` and `Offline`.

## `GET /admin/slaves/:id`

- [ ] Controller action: `Admin::SlavesController#show`, gated by `require_user` and `can_configure_slaves!`.
- [ ] Finds by `Slave.from_param!(params[:id])`, which calls `find_by!(name: param)`.
- [ ] Heading: `Slave %{name}`.
- [ ] Action list includes `Edit`, `Clone`, and `Delete`.
- [ ] `Edit` links to `GET /admin/slaves/:name/edit`.
- [ ] `Clone` links to `GET /admin/slaves/new?clone=:name`.
- [ ] `Delete` submits `DELETE /admin/slaves/:name` with confirmation text `Do you really want to delete this slave? This operation can not be undone.`
- [ ] Detail fields displayed are `Offline`, `Protocol`, `Host name`, `Busy?`, and `Capabilities`.
- [ ] Offline display is textual `Yes` or `No`; the show page does not use online/offline icon images.
- [ ] `Busy?` displays `@slave.busy?.inspect`, so the UI currently shows literal `true` or `false`.
- [ ] The show page does not display username, password, base path, environment variables, maximum builds, current running builds, current build names, or a current build link.
- [ ] The page includes a `Slaves Overview` link back to `/admin/slaves`.

> **SPA note:** The issue asks for a current-build display on the slave show page, but the current Rails show page only exposes `Busy?`. Running builds are rendered on the dashboard slave-status partial, not here. Treat current-build detail as a new SPA/API requirement if it is desired.

## `GET /admin/slaves/new`

- [ ] Controller action: `Admin::SlavesController#new`, gated by `require_user` and `can_configure_slaves!`.
- [ ] Without `clone`, initializes a blank `Slave.new`.
- [ ] Heading: `New Slave`.
- [ ] Form posts to `POST /admin/slaves`.
- [ ] Submit label: `Create`.
- [ ] Validation errors render through legacy `f.error_messages`.
- [ ] Required model validations are `name` presence, `name` uniqueness, and `protocol` presence.
- [ ] The form has an `Offline` checkbox.
- [ ] The form has `Name` text field bound to `slave[name]`.
- [ ] The form has `Protocol` select bound to `slave[protocol]` with exactly two options: `localhost` and `ssh`.
- [ ] The form has `Host Name` text field bound to `slave[hostname]`.
- [ ] The form has `User Name` text field bound to `slave[username]`; the UI label is not `login`.
- [ ] The form has `Password` text field bound to `slave[password]`; the model encrypts this field.
- [ ] The form has `Base Path` text field bound to `slave[base_path]`, using `@slave.base_path(:skip_default)` as the visible value.
- [ ] Base path help text says leaving it blank uses the default `@slave.default_base_path`, which comes from `TinyCI::Config.base_path`.
- [ ] The form has an environment variables table with `Variable name` and `Value` text fields.
- [ ] Existing environment variables are sorted and rendered, then one blank row is appended for adding a new variable.
- [ ] Blank environment-variable keys are removed by `Slave#cleanup_environment` before save.
- [ ] The form has `Slave capabilities` textarea with 3 rows and a help link to `/help_topics/slaves`.
- [ ] Capabilities help text says values are separated by commas.
- [ ] The form has `Maximum builds` text field bound to `slave[max_builds]`.
- [ ] Maximum builds help text says `0 = unlimited`; schema default is `0`.
- [ ] There are no current form fields for port, SSH key path, timeout, or separate login name beyond `username`.
- [ ] The protocol select does not dynamically hide or require other fields. Both `localhost` and `ssh` show hostname, username, password, base path, environment variables, capabilities, and maximum builds.
- [ ] Cucumber coverage verifies creating a slave by filling only `name` and pressing `Create`.

> **SPA note:** Protocol-specific conditional fields are not implemented in the current Rails UI. If React hides SSH fields for `localhost` or enforces required fields for `ssh`, that would be new behavior and should be coordinated with backend validations.

## `GET /admin/slaves/new?clone=:name`

- [ ] Controller action: `Admin::SlavesController#new` calls `Slave.find_for_cloning!(params[:clone])`.
- [ ] Clone lookup uses the source slave name.
- [ ] Clone copies the source slave object attributes, including protocol, hostname, username, encrypted password value, base path, environment variables, offline flag, capabilities, and maximum builds.
- [ ] Clone clears `id`.
- [ ] Clone clears `name`.
- [ ] Clone sets `@new_record` to true so the form submits a create rather than an update.
- [ ] The user must enter a unique name before saving because `Slave` validates name uniqueness.
- [ ] Cucumber coverage verifies following `Clone`, entering `clone_slave`, pressing `Create`, and seeing the cloned slave.

## `POST /admin/slaves`

- [ ] Controller action: `Admin::SlavesController#create`, gated by `require_user` and `can_configure_slaves!`.
- [ ] Strong parameters permit `protocol`, `name`, `hostname`, `username`, `password`, `base_path`, `offline`, `capabilities`, `max_builds`, and `environment_variables`.
- [ ] `environment_variables` is permitted as a hash and coerced to a plain Hash in `Slave#environment_variables=`.
- [ ] On successful save, sets `flash.notice.created_slave` (`Successfully created slave`) and redirects to `GET /admin/slaves/:name`.
- [ ] On validation failure, renders `new` with HTTP 422.

## `GET /admin/slaves/:id/edit`

- [ ] Controller action: `Admin::SlavesController#edit`, gated by `require_user` and `can_configure_slaves!`.
- [ ] Finds by slave name via `Slave.from_param!`.
- [ ] Heading: `Edit Slave %{name}`.
- [ ] Form fields are identical to the new slave form.
- [ ] Submit label: `Update`.
- [ ] Cucumber coverage verifies changing `protocol` to `ssh` and seeing `ssh` after update.

## `PATCH/PUT /admin/slaves/:id`

- [ ] Controller action: `Admin::SlavesController#update`, gated by `require_user` and `can_configure_slaves!`.
- [ ] Uses the same strong-parameter allowlist as create.
- [ ] On successful update, sets `flash.notice.updated_slave` (`Successfully updated slave`) and redirects to `GET /admin/slaves/:name`.
- [ ] On validation failure, renders `edit` with HTTP 422.

## `DELETE /admin/slaves/:id`

- [ ] Controller action: `Admin::SlavesController#destroy`, gated by `require_user` and `can_configure_slaves!`.
- [ ] Finds by slave name via `Slave.from_param!`.
- [ ] Calls `@slave.destroy` unconditionally.
- [ ] On destroy, sets `flash.notice.deleted_slave` (`Successfully deleted slave`) and redirects to `/admin/slaves`.
- [ ] There is no guard preventing deletion of a slave with running builds.
- [ ] `Slave has_many :builds, dependent: :nullify`, so deleting a slave nulls existing build `slave_id` references instead of deleting builds.
- [ ] Cucumber coverage verifies deleting a slave removes it from the slaves page.

> **SPA note:** The delete confirmation is client-side only. A React implementation should still treat the backend as allowing deletion of busy slaves unless a new backend guard/API contract is added.

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
- [ ] The helper rewrites Textile links like `":slaves` to `":/help_topics/slaves`.
- [ ] The helper preserves external `http` links when the matched link target is `http`.
- [ ] `help_link(topic_name)` renders localized `navigation.help` text pointing at `help_topic_path(topic_name)`.
- [ ] Existing topic files include `about`, `index`, `plan`, `plan/chain`, `plan/child`, `project`, `slaves`, `test`, and `users`.
- [ ] Cucumber coverage verifies loading topic `test` shows `Test Page`.

> **SPA note:** Help topics are filesystem-backed Textile documents, not database rows. A React migration needs either an endpoint that renders/sanitizes Textile HTML server-side or a build/runtime content pipeline that preserves wildcard nested topic IDs and 404 behavior.

## Locale Keys Used In This Area

- [ ] Admin configuration: `admin.configurations.show.update`.
- [ ] Admin slave edit: `admin.slaves.edit.edit_slave`, `admin.slaves.edit.update`.
- [ ] Admin slave form: `admin.slaves.form.base_path`, `base_path_description`, `capabilities_description`, `host_name`, `max_builds_description`, `maximum_builds`, `name`, `offline`, `password`, `protocol`, `slave_capabilities`, `user_name`, `value`, `variable_name`.
- [ ] Admin slave index: `admin.slaves.index.add_the_first_slave`, `hostname`, `listing_slaves`, `name`, `new_slave`, `offline`, `online`, `or`, `protocol`, `status`, `there_are_no_slaves_configured_yet`, `use_localhost_as_the_first_slave`.
- [ ] Admin slave new: `admin.slaves.new.create`, `admin.slaves.new.new_slave`.
- [ ] Admin slave show: `admin.slaves.show.busy`, `capabilities`, `clone`, `delete`, `delete_confirmation`, `edit`, `host_name`, `no`, `offline`, `protocol`, `slave_name`, `slaves_overview`, `yes`.
- [ ] User settings: `configurations.show.update`.
- [ ] Flash messages: `flash.error.access_denied`, `flash.notice.login_required`, `flash.notice.created_slave`, `flash.notice.updated_slave`, `flash.notice.deleted_slave`, `flash.notice.updated_configuration`.
- [ ] Layout keys: `layouts.all_plans`, `close_flash`, `configuration`, `github_project_page`, `guest_greeter`, `help`, `home`, `login`, `logout`, `projects`, `quick_links`, `report_bugs_html`, `report_link_text`, `settings`, `setup`, `signup`, `slaves`, `subtitle`, `user_greeter`, `users`, `you_are_here_html`.
- [ ] Help link key: `navigation.help`.
- [ ] Breadcrumb keys relevant to this area: `breadcrumb.admin`, `breadcrumb.configuration`, `breadcrumb.edit`, `breadcrumb.help_topics`, `breadcrumb.home`, `breadcrumb.new`, `breadcrumb.settings`, `breadcrumb.slaves`.

