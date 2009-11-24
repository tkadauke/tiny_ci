module TinyCI
  module Steps
    module Builder
      class Rake < Step
        def initialize(build, tasks, pwd, environment = {})
          super(build)
          @tasks = tasks
          @environment = environment
          @pwd = pwd
        end
        
        def execute!
          run('rake', (['--trace'] + @tasks), @pwd, @environment.merge('TESTOPTS' => '-v'))
        end
      end
    end
  end
end
