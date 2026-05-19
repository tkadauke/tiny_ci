# frozen_string_literal: true

# This is the authoritative schema for TinyCI on modern Rails (7.2+).
# Bootstrap a fresh database with `bin/rails db:schema:load`. The original
# Rails 2.3-era migrations were removed in #60 (git history preserves them);
# future schema changes go through new migrations from this baseline.

ActiveRecord::Schema[7.2].define(version: 2026_05_01_000002) do
  create_table "builds", force: :cascade do |t|
    t.integer  "plan_id"
    t.integer  "position"
    t.text     "output", limit: 4_294_967_295
    t.string   "status"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.integer  "slave_id"
    t.integer  "parent_id"
    t.text     "parameters"
    t.string   "revision"
    t.datetime "started_at"
    t.datetime "finished_at"
    t.integer  "starter_id"
    t.bigint   "github_check_run_id"
    t.index    ["plan_id"]
    t.index    ["parent_id"]
  end

  create_table "config_options", force: :cascade do |t|
    t.string   "key"
    t.text     "value"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.integer  "user_id"
  end

  create_table "plans", force: :cascade do |t|
    t.string   "name"
    t.text     "description"
    t.text     "steps"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.integer  "parent_id"
    t.integer  "previous_plan_id"
    t.string   "repository_url"
    t.text     "requirements"
    t.string   "status"
    t.integer  "weather"
    t.integer  "last_build_time"
    t.datetime "last_succeeded_at"
    t.datetime "last_failed_at"
    t.integer  "project_id"
    t.index    ["project_id"]
    t.index    ["parent_id"]
  end

  create_table "projects", force: :cascade do |t|
    t.string   "name"
    t.text     "description"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.bigint   "github_installation_id"
    t.string   "github_repo_full_name"
  end

  create_table "slaves", force: :cascade do |t|
    t.string   "protocol"
    t.string   "name"
    t.string   "hostname"
    t.string   "username"
    t.text     "password"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.string   "base_path"
    t.text     "environment_variables"
    t.boolean  "offline"
    t.text     "capabilities"
    t.integer  "max_builds", default: 0
  end

  create_table "users", force: :cascade do |t|
    t.string   "login",           null: false
    t.string   "email",           null: false
    t.string   "password_digest", null: false
    t.datetime "created_at"
    t.datetime "updated_at"
    t.string   "role"
    t.index    ["login"], unique: true
    t.index    ["email"], unique: true
  end
end
