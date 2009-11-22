class Guest
  include Role::Guest
  
  def initialize
    make_initial_admin if initial_admin?
  end
  
  def initial_admin?
    @initial_admin ||= User.count == 0
  end
  
  def to_user
    nil
  end
  
private
  def make_initial_admin
    extend Role::InitialAdmin
  end
end
