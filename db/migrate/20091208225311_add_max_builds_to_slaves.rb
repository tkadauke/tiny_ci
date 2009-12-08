class AddMaxBuildsToSlaves < ActiveRecord::Migration
  def self.up
    add_column :slaves, :max_builds, :integer, :default => 0
  end

  def self.down
    remove_column :slaves, :max_builds
  end
end
