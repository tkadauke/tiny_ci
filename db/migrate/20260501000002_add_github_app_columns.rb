class AddGithubAppColumns < ActiveRecord::Migration[7.2]
  def change
    add_column :projects, :github_installation_id, :bigint
    add_column :projects, :github_repo_full_name,  :string
    add_column :builds,   :github_check_run_id,    :bigint
  end
end
