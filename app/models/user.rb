class User < ActiveRecord::Base
  acts_as_authentic
  
  attr_protected :role
  
  def after_initialize
    if self.role.blank?
      extend Role::User
    else
      extend "Role::#{self.role.classify}".constantize
    end
  end
  
  def to_param
    login
  end
  
  def self.from_param!(param)
    find_by_login!(param)
  end
  
  def initial_admin?
    false
  end
  
  def to_user
    self
  end
end
