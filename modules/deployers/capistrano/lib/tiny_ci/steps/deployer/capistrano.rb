module TinyCI
  module Steps
    module Deployer
      class Capistrano < Step
        def initialize(build, tasks, pwd, environment = {})
          super(build)
          @tasks = tasks
          @environment = environment
          @pwd = pwd
        end
        
        def execute!
          run('cap', @tasks, @pwd, @environment)
        end
      end
    end
  end
end
