module TinyCI
  module Shell
    class CommandExecutionFailed < StandardError; end

    def self.open(build)
      klass = for_protocol(build.worker.protocol)
      raise ArgumentError, "Unknown shell protocol: #{build.worker.protocol.inspect}" unless klass
      klass.new(build)
    end

    def self.for_protocol(protocol)
      case protocol
      when "localhost" then Localhost
      when "ssh"       then SSH
      end
    end
  end
end
