module TinyCI
  module Notifier
    class GrowlNotifier < Base
      def success(build)
        if growl_available?
          connection.notify "TinyCI Notification", "Success", "Build #{build.project.name} / #{build.name} (##{build.position}) finished successfully!"
        end
      rescue SocketError
        raise "Could not connect to Growl on #{host}"
      end
    
      def failure(build)
        if growl_available?
          connection.notify "TinyCI Notification", "Failure", "Build #{build.project.name} / #{build.name} (##{build.position}) failed (status #{build.status})!"
        end
      rescue SocketError
        raise "Could not connect to Growl on #{host}"
      end
    
    protected
      def growl_available?
        @growl_available ||= (load_growl && !host.nil?)
      end
      
      def connection
        @connection ||= Growl.new host, "TinyCI", ["TinyCI Notification"]
      end
      
      def load_growl
        require 'ruby-growl'
        true
      rescue LoadError
        false
      end
      
      def host
        @recipient.config.growl_host
      end
    end
  end
end
