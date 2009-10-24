module SimpleCI
  module Steps
    module Builder
      class Rake < Step
        def initialize(build, tasks, environment = {})
          super(build)
          @tasks = tasks
          @environment = environment
        end
        
        def execute!
          run('rake', (['--trace'] + @tasks), nil, @environment.merge('TESTOPTS' => '-v'))
        end
      end
    end
  end
end
