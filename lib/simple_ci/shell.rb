module SimpleCI
  module Shell
    def self.open(build)
      klass = for_protocol(build.slave.protocol)
      klass.new(build)
    end
    
    def self.for_protocol(protocol)
      case protocol
      when 'localhost' then Localhost
      when 'ssh' then SSH
      end
    end
  end
end
