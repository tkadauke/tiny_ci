module SimpleCI
  module SourceControl
    class Base
      include SimpleCI::Util::Executor
      
      def initialize(build, options)
        @build = build
        @options = options
      end
      
      def repository_url
        @options[:url]
      end
    end
  end
end
