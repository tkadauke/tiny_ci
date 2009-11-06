class AddProjectIdToPlan < ActiveRecord::Migration
  def self.up
    add_column :plans, :project_id, :integer
    
    Project.reset_column_information
    default = Project.find_or_create_by_name('Default')
    
    Plan.reset_column_information
    Plan.all.each do |plan|
      plan.update_attributes(:project_id => default.id)
    end
  end

  def self.down
    remove_column :plans, :project_id
  end
end
