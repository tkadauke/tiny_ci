class AddTimestampsToBuilds < ActiveRecord::Migration
  def self.up
    add_column :builds, :started_at, :datetime
    add_column :builds, :finished_at, :datetime
  end

  def self.down
    remove_column :builds, :finished_at
    remove_column :builds, :started_at
  end
end
