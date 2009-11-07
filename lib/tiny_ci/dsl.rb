module TinyCI
  class DSL
    def self.evaluate(build)
      dsl = new(build)
      dsl.instance_eval do
        if build.repository_url
          repository :git
          update
        end
      end
      dsl.instance_eval build.plan.steps
    end
    
    def initialize(build)
      @build = build
    end
    
    def env(hash)
      @build.environment.update(hash)
    end
    
    def repository(system, options = {})
      source_control = "TinyCI::SourceControl::#{system.to_s.camelize}".constantize.new(@build, options)
      @build.source_control = source_control
    end
    
    def update(options = {})
      TinyCI::Steps::SourceControl::Update.new(@build, options).run!
    end
    
    def rake(*tasks)
      environment = tasks.extract_options!
      TinyCI::Steps::Builder::Rake.new(@build, tasks, environment).run!
    end
    
    def sh(command, *parameters)
      @build.shell.run(command, parameters, @build.workspace_path, @build.environment)
    end
  end
end
