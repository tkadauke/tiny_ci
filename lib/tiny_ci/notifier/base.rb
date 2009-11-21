module TinyCI
  module Notifier
    class Base
      def self.notify(build)
        if build.good?
          success(build)
        elsif build.bad?
          failure(build)
        end
      end
      
      def self.success(build)
        subclasses.each do |klass|
          klass.constantize.new.success(build)
        end
      end
      
      def self.failure(build)
        subclasses.each do |klass|
          klass.constantize.new.failure(build)
        end
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
