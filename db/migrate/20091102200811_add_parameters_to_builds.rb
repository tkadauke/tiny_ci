class AddParametersToBuilds < ActiveRecord::Migration
  def self.up
    add_column :builds, :parameters, :text
  end

  def self.down
    remove_column :builds, :parameters
  end
end
