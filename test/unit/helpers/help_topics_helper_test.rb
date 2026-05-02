require_relative "../test_helper"

class HelpTopicsHelperTest < ActionView::TestCase
  test "should render textile as html" do
    html = render_help_text("h1. Hello")
    assert_match(/<h1>Hello<\/h1>/, html)
    assert html.html_safe?
  end

  test "should rewrite topic links to help_topic paths" do
    html = render_help_text(%{See "Intro":introduction for details})
    assert_match(%r{href="/help_topics/introduction"}, html)
  end

  test "should leave http links untouched" do
    html = render_help_text(%{Visit "Example":http://example.com})
    assert_match(%r{href="http://example.com"}, html)
    assert_no_match(%r{/help_topics/http}, html)
  end

  test "should build a help link to the given topic" do
    html = help_link("introduction")
    assert_match(%r{href="/help_topics/introduction"}, html)
  end
end
