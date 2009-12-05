module TinyCI
  class Config < TinyCI::BaseConfig
    include Singleton
    
    def initialize
      @user_id = nil
    end
    
    class << self
      def method_missing(method)
        instance.send(method)
      end
    end
  end
end
