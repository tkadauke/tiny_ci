module TinyCI
  module SourceControl
    class Base
      include TinyCI::Util::Executor
      
      def initialize(build, options)
        @build = build
        @options = options
      end
    end
  end
end
