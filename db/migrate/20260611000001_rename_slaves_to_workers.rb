class RenameSlavesToWorkers < ActiveRecord::Migration[7.2]
  def change
    rename_table :slaves, :workers
  end
end
