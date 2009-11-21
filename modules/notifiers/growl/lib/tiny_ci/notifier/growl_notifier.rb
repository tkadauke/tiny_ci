module TinyCI
  module Notifier
    class GrowlNotifier < Base
      def success(build)
        if growl_available?
          connection.notify "TinyCI Notification", "Success", "Build #{build.project.name} / #{build.name} (##{build.position}) finished successfully!"
        end
      end
    
      def failure(build)
        if growl_available?
          connection.notify "TinyCI Notification", "Failure", "Build #{build.project.name} / #{build.name} (##{build.position}) failed (status #{build.status})!"
        end
      end
    
    protected
      def growl_available?
        @growl_available ||= load_growl
      end
      
      def connection
        @connection ||= Growl.new TinyCI::Config.growl_host, "TinyCI", ["TinyCI Notification"]
      end
      
      def load_growl
        require 'ruby-growl'
        true
      rescue LoadError
        false
      end
    end
  end
end
