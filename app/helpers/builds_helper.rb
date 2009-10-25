module BuildsHelper
  def render_report(report, version)
    template_path = "#{RAILS_ROOT}/lib/simple_ci/report/templates/#{version}/#{report.class.name.underscore.split('/').last}.html.erb"
    begin
      render :file => template_path, :locals => { :report => report }
    rescue ActionView::MissingTemplate
      ""
    end
  end
end
