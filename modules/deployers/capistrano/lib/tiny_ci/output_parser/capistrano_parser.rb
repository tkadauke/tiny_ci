module TinyCI
  module OutputParser
    class CapistranoParser < Base
      def parse!
        @result = TinyCI::Report::DeployReport.new
        @result.deploy_tool = 'cap'
        
        while !empty?
          line = consume!.line
          
          if line =~ /^\s*\* executing `(.*?)'$/
            task = CapistranoTaskParser.parse(@output)
            @result.tasks << task
            task.name = $1
          end
        end
      end
    end
  end
end
