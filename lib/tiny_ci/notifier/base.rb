module TinyCI
  module Notifier
    class Base
      def self.notify(build)
        if build.good?
          recipients.each { |recipient| success(recipient, build) }
        elsif build.bad?
          recipients.each { |recipient| failure(recipient, build) }
        end
      end
      
      def self.success(recipient, build)
        subclasses.each do |klass|
          klass.constantize.new(recipient).success(build)
        end
      end
      
      def self.failure(recipient, build)
        subclasses.each do |klass|
          klass.constantize.new(recipient).failure(build)
        end
      end
      
      def self.recipients
        User.all
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
