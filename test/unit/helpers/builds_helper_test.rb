require_relative "../test_helper"

class BuildsHelperTest < ActionView::TestCase
  class TestReport
  end

  test "should render report if template is available" do
    report = TestReport.new
    expects(:render).with(has_entry(locals: { report: report })).returns("result")
    assert_equal "result", render_report(report, :details)
  end

  test "should return empty string if template is missing" do
    report = TestReport.new
    expects(:render).raises(ActionView::MissingTemplate.new(["paths"], "path", [], false, "html"))
    assert_equal "", render_report(report, :details)
  end

  test "should render stop link as a POST form" do
    project = Project.new(name: "p")
    plan = stub(to_param: "main")
    build = stub(to_param: "1", to_key: nil, model_name: ActiveModel::Name.new(Build))
    project.stubs(to_param: "p")
    html = stop_link(project, plan, build)
    assert_match(/<form/, html)
    assert_match(/method="post"/, html)
    assert_match(/Stop/, html)
  end

  test "should include the stop icon" do
    project = Project.new(name: "p")
    plan = stub(to_param: "main")
    build = stub(to_param: "1", to_key: nil, model_name: ActiveModel::Name.new(Build))
    project.stubs(to_param: "p")
    html = stop_link(project, plan, build)
    assert_match(%r{icons/small/stopped\.png}, html)
  end
end
