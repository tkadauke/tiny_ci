module Role::InitialAdmin
  include Role::Base
  
  allow :configure_slaves, :configure_system_variables
  
  allow :create_accounts
  allow :create_projects, :create_plans
  allow :edit_projects, :edit_plans, :edit_plan
  allow :destroy_projects, :destroy_plans, :destroy_plan
end
