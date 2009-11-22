module Role::User
  include Role::Base
  
  allow :create_projects, :create_plans
  allow :edit_projects, :edit_plans, :edit_plan
  
  def can_edit_account?(user)
    user == self
  end
end
