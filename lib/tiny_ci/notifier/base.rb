module TinyCI
  module Notifier
    class Base
      class << self
        def notify(build)
          if build.good?
            recipients.each { |recipient| success(recipient, build) }
          elsif build.bad?
            recipients.each { |recipient| failure(recipient, build) }
          end
        end
      
        def success(recipient, build)
          subclasses.each do |klass|
            log_exceptions { klass.constantize.new(recipient).success(build) }
          end
        end
      
        def failure(recipient, build)
          subclasses.each do |klass|
            log_exceptions { klass.constantize.new(recipient).failure(build) }
          end
        end
      
        def recipients
          User.all
        end
        
      private
        def log_exceptions(&block)
          begin
            yield
          rescue Exception => e
            RAILS_DEFAULT_LOGGER.info(e.message)
          end
        end
      end
      
      def initialize(recipient)
        @recipient = recipient
      end
      
      def success(build)
        raise NotImplementedError
      end
      
      def failure(build)
        raise NotImplementedError
      end
    end
  end
end
