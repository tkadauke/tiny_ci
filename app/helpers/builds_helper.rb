module BuildsHelper
  def render_report(report, version)
    template_path = "#{RAILS_ROOT}/lib/tiny_ci/report/templates/#{version}/#{report.class.name.underscore.split('/').last}.html.erb"
    begin
      render :file => template_path, :locals => { :report => report }
    rescue ActionView::MissingTemplate
      ""
    end
  end
  
  def stop_link(project, plan, build)
    spinner_id = dom_id(build, :spinner)
    html = ""
    html << link_to_remote(image_tag("icons/small/stopped.png") + ' Stop', :url => stop_project_plan_build_path(project, plan, build), :method => :post, :before => "$('#{spinner_id}').show()")
    html << image_tag('spinner.gif', :id => spinner_id, :style => 'display: none')
    html
  end
end
