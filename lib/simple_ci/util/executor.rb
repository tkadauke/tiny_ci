module SimpleCI
  module Util
    module Executor
      def run(command, parameters, working_dir = nil, environment = {})
        @build.shell.run(command, parameters, working_dir || @build.workspace_path, @build.environment.merge(environment))
      end
      
      def exists?(path, working_dir = nil)
        @build.shell.exists?(path, working_dir || @build.workspace_path)
      end
    end
  end
end
