module SimpleCI
  module Steps
    module SourceControl
      class Update < Step
        def initialize(build, options = {})
          super(build)
          @options = options
        end
        
        def execute!
          @build.source_control.update
        end
      end
    end
  end
end
