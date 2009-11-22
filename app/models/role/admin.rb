module Role::Admin
  include Role::Base
  
  allow :create_accounts, :assign_roles
  
  def method_missing(method, *args)
    if method.to_s =~ /^can_.*\?$/
      true
    else
      super
    end
  end
end
