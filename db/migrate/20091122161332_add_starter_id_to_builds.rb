class AddStarterIdToBuilds < ActiveRecord::Migration
  def self.up
    add_column :builds, :starter_id, :integer
  end

  def self.down
    remove_column :builds, :starter_id
  end
end
