class RenameProjectsToPlans < ActiveRecord::Migration
  def self.up
    rename_table :projects, :plans
    rename_column :plans, :previous_project_id, :previous_plan_id
    rename_column :builds, :project_id, :plan_id
  end

  def self.down
    rename_column :builds, :plan_id, :project_id
    rename_column :plans, :previous_plan_id, :previous_project_id
    rename_table :plans, :projects
  end
end
