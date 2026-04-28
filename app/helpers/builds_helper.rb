module BuildsHelper
  def render_report(report, version)
    template_path = Rails.root.join("lib/tiny_ci/report/templates", version.to_s, "#{report.class.name.underscore.split('/').last}.html.erb").to_s
    render(file: template_path, locals: { report: report })
  rescue ActionView::MissingTemplate
    ""
  end

  def stop_link(project, plan, build)
    button_to(
      image_tag("icons/small/stopped.png") + " Stop",
      stop_project_plan_build_path(project, plan, build),
      method: :post,
      class: "stop-link"
    )
  end
end
