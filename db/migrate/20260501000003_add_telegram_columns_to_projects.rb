class AddTelegramColumnsToProjects < ActiveRecord::Migration[7.2]
  def change
    add_column :projects, :telegram_chat_id,    :string
    add_column :projects, :telegram_thread_id,  :integer
  end
end
