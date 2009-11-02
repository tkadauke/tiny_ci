class AddRevisionToBuilds < ActiveRecord::Migration
  def self.up
    add_column :builds, :revision, :string
  end

  def self.down
    remove_column :builds, :revision
  end
end
