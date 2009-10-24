module SimpleCI
  class DSL
    def self.evaluate(build)
      new(build).instance_eval build.project.steps
    end
    
    def initialize(build)
      @build = build
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
