module BuildsHelper
  def render_report(report, version)
    partial = "build_reports/#{version}/#{report.class.name.demodulize.underscore}"
    render(partial: partial, locals: { report: report })
  rescue ActionView::MissingTemplate
    ""
  end
end
