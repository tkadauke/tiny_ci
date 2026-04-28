module TinyCI
  module Report
    class DeployReport < Base
      attr_accessor :deploy_tool, :targets
      attr_reader :tasks

      def initialize
        super
        @tasks = []
      end
    end
  end
end
