module SimpleCI
  class DSL
    def self.run(build_name, &block)
      new(build_name).instance_eval &block
    end
    
    def self.evaluate(build_name, code)
      new(build_name).instance_eval code
    end
    
    def initialize(build_name)
      @connection = SimpleCI::Connection::Localhost.new
      @build = SimpleCI::Build.new(@connection, build_name)
    end
    
    def env(hash)
      @build.environment.update(hash)
    end
    
    def repository(system, options = {})
      source_control = "SimpleCI::SourceControl::#{system.to_s.camelize}".constantize.new(@build, options)
      @build.source_control = source_control
    end
    
    def update(options = {})
      SimpleCI::Steps::SourceControl::Update.new(@build, options).run!
    end
    
    def rake(*tasks)
      environment = tasks.extract_options!
      SimpleCI::Steps::Builder::Rake.new(@build, tasks, environment).run!
    end
  end
end
