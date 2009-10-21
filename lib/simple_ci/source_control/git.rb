module SimpleCI
  module SourceControl
    class Git < Base
      def update
        if exists?('.git')
          run("git", "pull origin master")
        else
          run("git", "clone #{repository_url} .")
        end
        
        run("git", "submodule init")
        run("git", "submodule update")
      end
    end
  end
end
