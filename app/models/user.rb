class User < ActiveRecord::Base
  acts_as_authentic
  
  def to_param
    login
  end
  
  def self.from_param!(param)
    find_by_login!(param)
  end
end
