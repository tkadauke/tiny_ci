class AddPreviousProjectIdToProjects < ActiveRecord::Migration
  def self.up
    add_column :projects, :previous_project_id, :integer
  end

  def self.down
    remove_column :projects, :previous_project_id
  end
end
