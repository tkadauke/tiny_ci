class AddWebhookColumnsToProjects < ActiveRecord::Migration[7.2]
  def change
    add_column :projects, :webhook_secret,   :string
    add_column :projects, :webhooks_enabled, :boolean, default: true, null: false
  end
end
