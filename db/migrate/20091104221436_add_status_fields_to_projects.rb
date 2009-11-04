class AddStatusFieldsToProjects < ActiveRecord::Migration
  def self.up
    add_column :projects, :status, :string
    add_column :projects, :weather, :integer
    add_column :projects, :last_build_time, :integer
    add_column :projects, :last_succeeded_at, :datetime
    add_column :projects, :last_failed_at, :datetime
  end

  def self.down
    remove_column :projects, :last_failed_at
    remove_column :projects, :last_succeeded_at
    remove_column :projects, :last_build_time
    remove_column :projects, :weather
    remove_column :projects, :status
  end
end
