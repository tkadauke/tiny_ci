module TinyCI
  # Build-step DSL. Plan steps are stored in the database as Ruby source.
  # Before evaluation we walk the source's Prism AST and reject anything
  # outside a strict allowlist (sh, rake, cap, cd, env, repository, update
  # with literal-only arguments) — see TinyCI::DSL::Validator. That closes
  # the legacy RCE-from-DB (modernize.md §3.6) while still letting
  # existing plans run unchanged. Plan editing should still be admin-gated.
  #
  # If the cloned repo contains a `tiny_ci.yml` at its root, that takes
  # precedence over the legacy plan-DSL — the runner parses it and runs
  # its stages instead of evaluating `plan.steps`. Migration to the
  # declarative format is tracked in #88.
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

      config = TinyCI::BuildConfig.load(dsl.pwd)
      if config
        config.stages.each { |stage| dsl.sh(stage.run) }
      elsif build.plan.steps.present?
        Validator.validate!(build.plan.steps)
        dsl.instance_eval build.plan.steps
      end
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
