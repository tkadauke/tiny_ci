class ChangeBuildsTextToLongText < ActiveRecord::Migration
  def self.up
    change_column :builds, :output, :text, :limit => 100.megabytes
  end

  def self.down
    change_column :builds, :output, :text
  end
end
