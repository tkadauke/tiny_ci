class CreateSlaves < ActiveRecord::Migration
  def self.up
    create_table :slaves do |t|
      t.string :protocol
      t.string :name
      t.string :hostname
      t.string :username
      t.string :password
      t.timestamps
    end
  end

  def self.down
    drop_table :slaves
  end
end
