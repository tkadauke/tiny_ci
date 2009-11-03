class AddCapabilitiesToSlavesAndRequirementsToProjects < ActiveRecord::Migration
  def self.up
    add_column :slaves, :capabilities, :text
    add_column :projects, :requirements, :text
  end

  def self.down
    remove_column :projects, :requirements
    remove_column :slaves, :capabilities
  end
end
