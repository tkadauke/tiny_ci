require_relative "../test_helper"

class ApplicationHelperTest < ActionView::TestCase
  test "should convert seconds in readable strings" do
    assert_equal "1 seconds", duration(1)
    assert_equal "2 minutes, 3 seconds", duration(123)
    assert_equal "2 minutes", duration(120)
    assert_equal "4 hours, 21 minutes, 5 seconds", duration(15665)
    assert_equal "4 hours, 21 minutes", duration(15660)
    assert_equal "4 hours, 5 seconds", duration(14405)
    assert_equal "15 days, 8 hours, 45 minutes, 2 seconds", duration(1327502)
    assert_equal "15 days, 2 seconds", duration(1296002)
  end

  test "bread_crumb root path renders just the home link" do
    stubs(:request).returns(stub(path: "/"))
    html = bread_crumb
    assert_match(%r{href="/"}, html)
    assert_match(/Home/, html)
  end

  test "bread_crumb resolves model segments via from_param!" do
    project = Project.create!(name: "myproj")
    project.plans.create!(name: "main")
    stubs(:request).returns(stub(path: "/projects/myproj/plans/main"))

    html = bread_crumb
    assert_match(/Home/, html)
    assert_match(/Projects/, html)
    assert_match(/myproj/, html)
    assert_match(/Plans/, html)
    assert_match(/main/, html)
  end

  test "bread_crumb falls back to i18n label when segment is not a model" do
    stubs(:request).returns(stub(path: "/help_topics"))
    html = bread_crumb
    # config/locales/en.yml: breadcrumb.help_topics → "Help"
    assert_match(/Help/, html)
  end
end
