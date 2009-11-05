module TinyCI
  module SourceControl
    class Git < Base
      def update
        if exists?('.git')
          run("git", "pull origin master")
        else
          run("git", "clone #{@build.repository_url} #{@build.name}", TinyCI::Config.base_path)
        end
        
        if @build.revision.blank?
          revision = capture(%{git rev-parse HEAD})
          @build.update_attributes(:revision => revision)
        else
          run("echo", "checking out revision #{@build.revision}")
          run("git", "checkout -f #{@build.revision}")
        end
        
        run("git", "submodule init")
        run("git", "submodule update")
      end
    end
  end
end
