module TinyCI
  module Report
    class BuildReport < Base
      attr_accessor :build_tool, :targets
      attr_reader :tasks

      def initialize
        super
        @tasks = []
      end
    end
  end
end
