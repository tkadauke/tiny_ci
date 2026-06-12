class RenameBuildsSlaveIdToWorkerId < ActiveRecord::Migration[7.2]
  def change
    rename_column :builds, :slave_id, :worker_id
  end
end
