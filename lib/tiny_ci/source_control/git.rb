module TinyCI
  module SourceControl
    class Git < Base
      def update
        reset
        clone_or_update
        find_or_checkout_revision
        update_submodules
      end
    
    protected
      def reset
        run("git", "reset --hard HEAD")
      end
      
      def clone_or_update
        if exists?('.git')
          run("git", "pull origin master")
        else
          dest = File.expand_path(@build.workspace_path + '/..')
          mkdir(dest)
          run("git", "clone #{@build.repository_url} #{@build.name}", dest)
        end
      end
      
      def find_or_checkout_revision
        if @build.revision.blank?
          revision = capture(%{git rev-parse HEAD})
          @build.update_attributes(:revision => revision)
        else
          run("git", "checkout -f #{@build.revision}")
        end
      end
      
      def update_submodules
        run("git", "submodule init")
        run("git", "submodule update")
      end
    end
  end
end
