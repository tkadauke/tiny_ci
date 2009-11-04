module TinyCI
  module OutputParser
    class RakeParser < Base
      def parse!
        @result = TinyCI::Report::BuildReport.new
        @result.build_tool = 'rake'
        
        while !empty?
          line = consume!.line
          
          if line =~ /^\*\* Execute (.*)$/
            task = case $1
            when 'test:units', 'test:functionals'
              RakeTestParser.parse(@output)
            else
              RakeTaskParser.parse(@output)
            end
            
            task.name = $1
            @result.tasks << task
          end
        end
      end
    end
  end
end
