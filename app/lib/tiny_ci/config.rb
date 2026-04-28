require "singleton"

module TinyCI
  class Config < TinyCI::BaseConfig
    include Singleton

    def initialize
      super
      @user_id = nil
    end

    class << self
      def method_missing(method)
        instance.send(method)
      end

      def respond_to_missing?(method, include_private = false)
        instance.respond_to?(method, include_private) || super
      end
    end
  end
end
