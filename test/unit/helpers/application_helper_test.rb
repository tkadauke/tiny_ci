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

  test "should resolve known project segment in breadcrumb" do
    project = stub(to_param: "myproject")
    Project.stubs(:from_param!).returns(project)
    stubs(request: stub(path: "/projects/myproject"))
    result = bread_crumb
    assert_match "myproject", result
  end

  test "should resolve nested plan segment in breadcrumb" do
    project = stub(to_param: "myproject")
    plan = stub(to_param: "myplan")
    plans_relation = stub(from_param!: plan)
    project.stubs(:plans).returns(plans_relation)
    Project.stubs(:from_param!).returns(project)
    stubs(request: stub(path: "/projects/myproject/plans/myplan"))
    result = bread_crumb
    assert_match "myproject", result
    assert_match "myplan", result
  end

  test "should return safely for unknown segment in breadcrumb" do
    stubs(request: stub(path: "/unknown/segment"))
    assert_nothing_raised { bread_crumb }
  end

  test "should not execute code injected via param segment in breadcrumb" do
    $breadcrumb_injection_executed = false
    Project.stubs(:from_param!).raises(ActiveRecord::RecordNotFound)
    stubs(request: stub(path: "/projects/'); $breadcrumb_injection_executed = true #"))
    bread_crumb
    assert_equal false, $breadcrumb_injection_executed
  ensure
    $breadcrumb_injection_executed = nil
  end

  test "should not constantize arbitrary class from unknown segment in breadcrumb" do
    stubs(request: stub(path: "/Kernel/exit!"))
    assert_nothing_raised { bread_crumb }
  end
end
