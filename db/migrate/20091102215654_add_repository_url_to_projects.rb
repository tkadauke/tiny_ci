class AddRepositoryUrlToProjects < ActiveRecord::Migration
  def self.up
    add_column :projects, :repository_url, :string
  end

  def self.down
    remove_column :projects, :repository_url
  end
end
