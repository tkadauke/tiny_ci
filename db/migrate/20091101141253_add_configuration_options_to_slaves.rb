class AddConfigurationOptionsToSlaves < ActiveRecord::Migration
  def self.up
    add_column :slaves, :base_path, :string
    add_column :slaves, :environment_variables, :text
  end

  def self.down
    remove_column :slaves, :environment_variables
    remove_column :slaves, :base_path
  end
end
