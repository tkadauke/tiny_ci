module TinyCI
  module Report
    class DeployTaskReport < Base
      attr_accessor :name
      
      def commands
        @commands ||= []
      end
    end
  end
end
