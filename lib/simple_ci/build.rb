module SimpleCI
  class Build
    attr_reader :connection, :name, :environment
    attr_accessor :source_control
    
    def initialize(connection, name)
      @connection = connection
      @name = name
      @environment = {}
    end
    
    def workspace_path
      "#{ENV['HOME']}/simple_ci/#{name}"
    end
  end
end
