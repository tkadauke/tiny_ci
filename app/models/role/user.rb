module Role::User
  include Role::Base
  
  allow :create_projects
  allow :edit_projects
  
  def can_edit_account?(user)
    user == self
  end
end
