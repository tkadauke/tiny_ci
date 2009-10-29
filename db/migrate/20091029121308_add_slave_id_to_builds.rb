class AddSlaveIdToBuilds < ActiveRecord::Migration
  def self.up
    add_column :builds, :slave_id, :integer
  end

  def self.down
    remove_column :builds, :slave_id
  end
end
