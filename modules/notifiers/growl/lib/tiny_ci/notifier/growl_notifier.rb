module TinyCI
  module Notifier
    class GrowlNotifier < Base
      def success(build)
        if growl_available?
          connection.notify "TinyCI Notification", I18n.t('growl_notifier.subject.success'), I18n.t('growl_notifier.text.success', :project => build.project.name, :plan => build.name, :build => build.position)
        end
      rescue SocketError
        raise "Could not connect to Growl on #{host}"
      end
    
      def failure(build)
        if growl_available?
          connection.notify "TinyCI Notification", I18n.t('growl_notifier.subject.failure'), I18n.t('growl_notifier.text.failure', :project => build.project.name, :plan => build.name, :build => build.position, :status => build.status)
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
