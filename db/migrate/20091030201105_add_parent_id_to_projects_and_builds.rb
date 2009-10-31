class AddParentIdToProjectsAndBuilds < ActiveRecord::Migration
  def self.up
    add_column :projects, :parent_id, :integer
    add_column :builds, :parent_id, :integer
  end

  def self.down
    remove_column :builds, :parent_id
    remove_column :projects, :parent_id
  end
end
