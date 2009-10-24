module SimpleCI
  module Report
    class Base
      attr_accessor :raw_output
      
      def to_html(version)
        template_path = File.dirname(__FILE__) + "/templates/#{version}/#{self.class.name.underscore.split('/').last}.html.erb"
        if File.exist?(template_path)
          report = self
          ERB.new(File.read(template_path)).result(binding)
        else
          ""
        end
      end
    end
  end
end
