class AddOfflineToSlaves < ActiveRecord::Migration
  def self.up
    add_column :slaves, :offline, :boolean
  end

  def self.down
    remove_column :slaves, :offline
  end
end
