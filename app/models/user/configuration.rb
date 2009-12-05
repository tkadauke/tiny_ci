class User
  class Configuration < TinyCI::BaseConfig
    def initialize(user)
      @user_id = user.id
    end
  end
end
