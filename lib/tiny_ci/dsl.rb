module TinyCI
  class DSL
    attr_reader :pwd
    
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
      @pwd = @build.workspace_path
    end
    
    def cd(path)
      old_pwd = @pwd
      
      if path =~ /^\//
        @pwd = File.expand_path(File.join(@build.workspace_path, path))
      else
        @pwd = File.expand_path(File.join(@pwd, path))
      end
      
      if block_given?
        yield
        @pwd = old_pwd
      end
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
    
    def sh(command, *parameters)
      @build.shell.run(command, parameters, @pwd, @build.environment)
    end
  end
end
