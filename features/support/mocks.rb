module Juggernaut
  class << self
    def send_to_channel(*args)
    end
  end
end

class DRbObject
  class Mock
    def method_missing(*args)
    end
  end
  
  def self.new(*args)
    Mock.new
  end
end

module DRb
  def self.start_service
  end
end
