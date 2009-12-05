class AddUserIdToConfigOptions < ActiveRecord::Migration
  def self.up
    add_column :config_options, :user_id, :integer
  end

  def self.down
    remove_column :config_options, :user_id
  end
end
