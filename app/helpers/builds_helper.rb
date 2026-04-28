module BuildsHelper
  def render_report(report, version)
    partial = "build_reports/#{version}/#{report.class.name.demodulize.underscore}"
    render(partial: partial, locals: { report: report })
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
