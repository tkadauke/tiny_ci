# Auth, Users, and First-Run Setup Inventory

Inventory source: `UserSessionsController`, `UsersController`, `Admin::SetupController`, `ApplicationController`, related views/helpers/models, `features/login.feature`, `features/signup.feature`, `features/profile.feature`, and English/German locale keys used by these screens.

## Cross-Cutting Auth State

- [ ] [guest] Treat visitors without `session[:user_id]` as `Guest`; if `User.count == 0`, the guest is extended with `Role::InitialAdmin`.
- [ ] [user] Treat visitors with a valid `session[:user_id]` as `User` records loaded by id; missing/deleted ids fall back to `Guest`.
- [ ] [guest,user,admin,initial_admin] Keep role checks method-driven: unknown `can_*?` permissions default false through `Role::Base`; `Role::Admin` returns true for every `can_*?`.
- [ ] [user] Allow normal users to create and edit projects and edit only their own account.
- [ ] [admin] Allow admins to create accounts, assign roles, and pass every `can_*?` permission gate.
- [ ] [initial_admin] Allow the first visitor before any user exists to create accounts, configure slaves/system variables, and create/edit/destroy projects and plans; this visitor is not a persisted user until signup succeeds.
- [ ] [guest] Redirect unauthenticated access to protected actions through `require_user`, set `flash.notice.login_required`, and store `session[:return_to] = request.original_fullpath`.

> **SPA note:** Authentication is cookie-session based. React requests that mutate state must include Rails CSRF protection, and client auth state should be derived from a server session/current-user endpoint rather than local storage.

> **SPA note:** `session[:return_to]` is stored for protected-route access but is not currently consumed after login; login always redirects to root. Decide whether the SPA preserves the legacy root redirect or implements return-after-login.

## Navigation and Layout Visibility

- [ ] [guest] Header shows `Welcome, Guest!`, `Login`, and `Signup`; it hides `Settings` and `Logout`.
- [ ] [user,admin] Header shows `Welcome, %{login}!`, `Settings`, and `Logout`; it hides `Login` and `Signup`.
- [ ] [guest,user,admin,initial_admin] Main application menu always shows `Home`, `All Plans`, `Projects`, `Users`, and `Help`.
- [ ] [initial_admin,admin] Main menu shows `Slaves` when `can_configure_slaves?` is true.
- [ ] [initial_admin,admin] Main menu shows `Configuration` when `can_configure_system_variables?` is true.
- [ ] [setup] Plain setup layout shows only the `Setup` menu item while `ENV["SETUP"] == "true"`.
- [ ] [guest,user,admin,initial_admin] Flash UI displays either `flash[:error]` or `flash[:notice]` with a close link.
- [ ] [guest,user,admin,initial_admin] Breadcrumbs are generated from path segments and model `from_param!` lookups where possible.

## GET /login

- [ ] [guest] Render login heading and submit label from `user_sessions.new.login`.
- [ ] [guest] Show fields `user_session[login]`, `user_session[password]`, and `user_session[remember_me]`.
- [ ] [guest] Label fields as `User name`, `Password`, and `Remember me` in English; German equivalents exist in `config/locales/de.yml`.
- [ ] [guest] Submit the form locally to `POST /login`.
- [ ] [user,admin] No controller guard prevents already logged-in users from viewing the login form.

> **SPA note:** The remember-me checkbox is displayed but ignored by the controller. Preserve the visual field only if the backend remains unchanged, or remove/implement it deliberately.

## POST /login

- [ ] [guest] Find the account by `params[:user_session][:login]`.
- [ ] [guest] Authenticate with `has_secure_password` against `params[:user_session][:password]`.
- [ ] [guest] On success, set `session[:user_id]`, set `flash.notice.logged_in` (`Successfully logged in`), and redirect to `root_url`.
- [ ] [guest] On failure, set `flash.now.error` from `flash.error.login_failed`, falling back to `Invalid login or password`, and re-render `new` with HTTP 422.
- [ ] [guest] Do not expose whether the login or password was the failing field.
- [ ] [guest] Keep validation display as a flash-level error; the login form has no model-backed field error list.

> **SPA note:** Login must send credentials to Rails and rely on the Set-Cookie session response. A JSON version should return the next location and localized flash/error payload explicitly.

## DELETE /logout

- [ ] [user,admin] Trigger logout from the header `Logout` link using the DELETE method.
- [ ] [user,admin] Call `reset_session`, set `flash.notice.logged_out` (`Successfully logged out`), and redirect to `root_url`.
- [ ] [guest] No controller guard prevents logout as a guest; it still resets the session and redirects to root.
- [ ] [user,admin] There is no confirmation dialog in the current UI; the visible confirmation is the success flash after redirect.

> **SPA note:** The legacy `link_to ... method: :delete` depends on Rails JavaScript/Turbo method handling. React should call a DELETE endpoint with CSRF and then clear client-side current-user state after the server confirms.

## GET /users

- [ ] [user,admin] Require login through `require_user`; guests are redirected to `GET /login` with `flash.notice.login_required`.
- [ ] [user,admin] Load all users with `User.all`.
- [ ] [user,admin] Render heading `Listing Users`.
- [ ] [user,admin] If there are users, show a table with columns `Login name` and `Options`.
- [ ] [user,admin] Link each login to `GET /users/:login`.
- [ ] [user,admin] Preserve or intentionally change the current permission behavior: despite being treated as an admin management screen, the controller allows any logged-in user to view the index.
- [ ] [user] Show `Edit` only for the current user's own row.
- [ ] [admin] Show `Edit` for every row because admins pass all `can_edit_account?` checks.
- [ ] [admin,initial_admin] Show `New Account` when `can_create_accounts?` is true.
- [ ] [user] Hide `New Account` for normal users.
- [ ] [initial_admin] Direct access redirects to login because `require_user` treats the initial admin as a guest; the unreachable empty-state template still contains `There are no user accounts yet.` and `Create first administrator account`.

## GET /users/new

- [ ] [guest,initial_admin,user,admin] Render signup/account creation form without a controller-level login guard.
- [ ] [guest,initial_admin,user,admin] Show fields `user[login]`, `user[email]`, `user[password]`, and `user[password_confirmation]`.
- [ ] [guest,initial_admin,user,admin] Show descriptions for login, email, and password confirmation.
- [ ] [guest,initial_admin,user,admin] Render `f.error_messages` validation summary when the `User` model has errors.
- [ ] [initial_admin] Use the same form UI as public signup; no role picker appears on create.
- [ ] [guest] Use the same form UI as initial admin signup; created accounts become normal users.
- [ ] [admin] Use the same form UI when adding an account; no role picker appears until editing after creation.
- [ ] [user] Logged-in normal users have no navigation link for creating accounts, but the route itself is not guarded.

## POST /users

- [ ] [guest] Public self-signup permits only `login`, `email`, `password`, and `password_confirmation`.
- [ ] [guest] On successful public signup, assign the default user role, set `flash.notice.created_account`, log in the new user by writing `session[:user_id]`, and redirect to root.
- [ ] [initial_admin] When `current_user.initial_admin?` is true, force `@user.role = "admin"` before save.
- [ ] [initial_admin] On successful initial admin signup, set `flash.notice.created_account`, log in the new admin, redirect to root, and reveal admin-only navigation such as `Configuration`.
- [ ] [admin] When an already logged-in admin creates a user, the new account is saved with default role unless later edited; the admin remains logged in and is redirected to `GET /users`.
- [ ] [user] Direct POST by a logged-in normal user also creates a default user account because `create` has no `can_create_accounts?` guard; after success it redirects to `GET /users`.
- [ ] [admin] Admin-created-user success flash is also `flash.notice.created_account`.
- [ ] [guest,initial_admin,user,admin] On validation failure, re-render `new` with HTTP 422 and model error summary.
- [ ] [guest,initial_admin,user,admin] Enforce `User` validations: login presence, uniqueness, alphanumeric/underscore/dash format; email presence and uniqueness; password digest presence via `has_secure_password`.

> **SPA note:** Signup has three behavioral variants from the same route and form. The SPA needs current-user plus `initial_admin?` state before choosing post-submit behavior and copy.

## GET /users/:id

- [ ] [guest,user,admin] Resolve `:id` by login using `User.from_param!`; numeric ids are not used in URLs.
- [ ] [guest,user,admin] Render heading `%{login}'s Profile`.
- [ ] [guest,user,admin] The profile body displays no fields beyond the login in the heading.
- [ ] [user] Show `Edit profile` only when viewing self.
- [ ] [admin] Show `Edit profile` for any user.
- [ ] [guest] Allow viewing profiles, but hide `Edit profile`.
- [ ] [guest,user,admin] Missing login raises ActiveRecord not found and uses the app's normal error handling.

## GET /users/:id/edit

- [ ] [user,admin] Require login through `require_user`.
- [ ] [user,admin] Resolve `:id` by login.
- [ ] [user] Allow access only when editing self; otherwise redirect to root with `flash.error.access_denied`.
- [ ] [admin] Allow editing any user.
- [ ] [user,admin] Render heading `Edit %{login}'s Profile`.
- [ ] [user,admin] Show editable `user[email]` field with notification description.
- [ ] [admin] Show editable `user[role]` select with values `user` and `admin` only when editing another account.
- [ ] [admin] Hide role select when editing self, even though admins can assign roles.
- [ ] [user] Hide role select for normal users.
- [ ] [user,admin] Do not show login or password fields on edit.
- [ ] [user,admin] Render `f.error_messages` validation summary on update errors.

## PATCH/PUT /users/:id

- [ ] [user,admin] Require login through `require_user`.
- [ ] [user] Permit only `login`, `email`, `password`, and `password_confirmation` at the strong-params layer, but the edit form only submits `email`.
- [ ] [user] Apply `can_edit_account!`; users editing another account are redirected to root with `flash.error.access_denied`.
- [ ] [admin] Allow updating another account and merge `params[:user][:role]` only when `can_assign_roles?` is true.
- [ ] [admin] Limit role assignment UI to `user` and `admin`; no UI assigns `initial_admin`.
- [ ] [user,admin] On success, set `flash.notice.updated_profile` (`Successfully updated %{login}'s profile`) and redirect to `GET /users/:login`.
- [ ] [user,admin] On validation failure, re-render `edit` with HTTP 422 and model error summary.

> **SPA note:** The Rails controller permits `login` and password updates even though the legacy edit form does not expose those fields. A JSON API should either preserve backend compatibility or narrow accepted fields to the intended SPA form.

## GET /admin/setup

- [ ] [setup] `ApplicationController#setup_redirect` sends all normal app requests to `/admin/setup` when `ENV["SETUP"] == "true"`.
- [ ] [setup] `Admin::SetupController` skips `setup_redirect`, uses the `plain` layout, and rejects setup routes by redirecting to `/` unless `ENV["SETUP"] == "true"`.
- [ ] [setup] Step sequence begins with `choose_language` when `session[:language]` is blank.
- [ ] [setup] Language choice form offers `English`/`en` and `Deutsch`/`de`, submits by GET, and stores `session[:language]`.
- [ ] [setup] After language is set, render the index step with `TinyCI::Setup::InitialConfig.new`.
- [ ] [setup] Default config values are `db_user = root`, `db_host = localhost`, and `db_name = tiny_ci_production`; password is blank.
- [ ] [setup] Render localized setup info partial (`_config_info` or `_config_info.de`) before the database form.
- [ ] [setup] Collect `config[db_user]`, `config[db_password]`, `config[db_name]`, and `config[db_host]`.
- [ ] [setup] Show password description warning that the password is saved as plain text in `Rails.root/config/database.yml`.

> **SPA note:** This wizard is available before normal database-backed boot is complete. A React migration must account for `SETUP=true` boot mode, where normal current-user and app-data endpoints may be unavailable.

## POST /admin/setup

- [ ] [setup] Merge submitted config params with `language: session[:language]`.
- [ ] [setup] Try a Trilogy database connection first with `database: db_name`, then with `database: nil`.
- [ ] [setup] On successful connection, render every `config/templates/*.yml.erb` file into `config/*.yml`.
- [ ] [setup] On successful connection, run `bin/rails db:prepare SETUP=false`.
- [ ] [setup] On success, redirect to `GET /admin/setup/restart`.
- [ ] [setup] On failure, set `flash.error.connect_to_database`, expose the raw connection error as `@config.error_message`, and re-render `index` with HTTP 422.
- [ ] [setup] Display setup form error block with `Could not connect to the database. The following error message was received:` and the raw error message.

> **SPA note:** Posting setup writes server-side config files and invokes database preparation. Treat this as an operational endpoint, not a normal user preference form.

## GET /admin/setup/restart

- [ ] [setup] Render localized restart partial saying TinyCI is restarting and linking to `/` as a fallback.
- [ ] [setup] Start a background thread that sleeps two seconds and sends `TERM` to the current process.
- [ ] [setup] Poll `/admin/setup/redirect_me` every five seconds via legacy `periodically_call_remote`.

> **SPA note:** This is the only live-update behavior in this auth/setup area. Replace the legacy polling helper with an explicit timer or health-check loop that navigates once the restarted app is available.

## GET /admin/setup/redirect

- [ ] [setup] Return JavaScript that sets `document.location.href='/'`.
- [ ] [setup] This action is exempt from `only_setup`; it can respond even after setup mode ends.
- [ ] [setup] Routes define this endpoint as `/admin/setup/redirect`, while the legacy restart view calls `/admin/setup/redirect_me`; verify/fix this mismatch during migration.

> **SPA note:** Prefer a JSON response or direct client-side navigation over server-rendered JavaScript.

## Locale Keys to Carry Forward

- [ ] [guest,user,admin,initial_admin] Auth flashes: `flash.notice.logged_in`, `flash.notice.logged_out`, `flash.notice.login_required`, `flash.notice.created_account`, `flash.notice.updated_profile`, `flash.error.access_denied`, `flash.error.connect_to_database`, and the code-only fallback for missing `flash.error.login_failed`.
- [ ] [guest] Login form keys under `user_sessions.new`: `login`, `user_name`, `password`, `remember_me`.
- [ ] [guest,user,admin,initial_admin] User form/list/profile keys under `users.new`, `users.index`, `users.show`, and `users.edit`.
- [ ] [setup] Setup form keys under `admin.setup.index`.
- [ ] [guest,user,admin,setup] Layout/navigation keys under `layouts`, plus breadcrumb keys for `home`, `login`, `new`, `users`, `edit`, `settings`, `admin`, and `configuration`.
- [ ] [guest,user,admin,setup] Preserve English and German translations where present; setup language chooser hard-codes its language labels rather than using locale keys.

## Test/Feature Expectations

- [ ] [guest] `features/login.feature` expects successful login to show `Successfully logged in`.
- [ ] [user] `features/login.feature` expects logout to show `Successfully logged out`.
- [ ] [initial_admin] `features/signup.feature` expects first signup to create an admin, show the new login, and reveal `Configuration`.
- [ ] [guest] `features/signup.feature` expects public signup to log in the new user, show the new login, and hide `Configuration`.
- [ ] [admin] `features/signup.feature` expects admin-created-user flow to keep showing the admin login after account creation.
- [ ] [guest] `features/profile.feature` expects public profile pages to show the target login.
- [ ] [user] `features/profile.feature` expects users to edit their own email and see `Successfully updated %{login}'s profile`.
