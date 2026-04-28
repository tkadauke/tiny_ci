class ChangeSlavesPasswordToText < ActiveRecord::Migration[7.2]
  def up
    change_column :slaves, :password, :text
  end

  def down
    change_column :slaves, :password, :string
  end
end
