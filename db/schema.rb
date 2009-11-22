# This file is auto-generated from the current state of the database. Instead of editing this file, 
# please use the migrations feature of Active Record to incrementally modify your database, and
# then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your database schema. If you need
# to create the application database on another system, you should be using db:schema:load, not running
# all the migrations from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended to check this file into your version control system.

ActiveRecord::Schema.define(:version => 20091121223404) do

  create_table "builds", :force => true do |t|
    t.integer  "plan_id"
    t.integer  "position"
    t.text     "output",      :limit => 2147483647
    t.string   "status"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.integer  "slave_id"
    t.integer  "parent_id"
    t.text     "parameters"
    t.string   "revision"
    t.datetime "started_at"
    t.datetime "finished_at"
  end

  create_table "config_options", :force => true do |t|
    t.string   "key"
    t.text     "value"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "plans", :force => true do |t|
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
  end

  create_table "projects", :force => true do |t|
    t.string   "name"
    t.text     "description"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "slaves", :force => true do |t|
    t.string   "protocol"
    t.string   "name"
    t.string   "hostname"
    t.string   "username"
    t.string   "password"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.string   "base_path"
    t.text     "environment_variables"
    t.boolean  "offline"
    t.text     "capabilities"
  end

end
