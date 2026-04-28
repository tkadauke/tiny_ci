module TinyCI
  # Build-step DSL. Plan steps are stored in the database as Ruby source and
  # executed via instance_eval against an instance of this class. That is a
  # remote-code-execution vector by design — anyone who can edit a plan can
  # run arbitrary code on every build slave. Replacing this with a sandboxed
  # / structured step format is tracked as a P0 in docs/modernize.md §3.6.
  # Until then, plan editing must remain admin-gated.
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

      @pwd =
        if path.start_with?("/")
          File.expand_path(File.join(@build.workspace_path, path))
        else
          File.expand_path(File.join(@pwd, path))
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

    # Build steps. Adding a new step type is a class definition under
    # TinyCI::Steps + a method on the DSL.

    def rake(*tasks)
      environment = tasks.extract_options!
      Steps::Builder::Rake.new(@build, tasks, @pwd, environment).run!
    end

    def cap(*tasks)
      environment = tasks.extract_options!
      Steps::Deployer::Capistrano.new(@build, tasks, @pwd, environment).run!
    end
  end
end
