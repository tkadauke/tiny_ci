require_relative "../../test_helper"

class Api::HelpTopicsControllerTest < ActionController::TestCase
  test "should render help topic as json html" do
    get :show, params: { id: "test" }, format: :json

    assert_response :success
    payload = response.parsed_body
    assert_equal "Test Page", payload["title"]
    assert_match(/<p>.*Lorem ipsum.*<\/p>/m, payload["html"])
  end

  test "should rewrite internal textile links and preserve http links" do
    HelpTopic.any_instance.stubs(:title).returns("Links")
    HelpTopic.any_instance.stubs(:text).returns(%{See "Slaves":slaves and "Example":http://example.com})
    HelpTopic.any_instance.stubs(:load).returns(["Links", "body"])

    get :show, params: { id: "test" }, format: :json

    assert_response :success
    html = response.parsed_body["html"]
    assert_match(%r{href="/help_topics/slaves"}, html)
    assert_match(%r{href="http://example.com"}, html)
    assert_no_match(%r{/help_topics/http}, html)
  end

  test "should render json 404 when help topic does not exist" do
    get :show, params: { id: "asdf" }, format: :json

    assert_response :not_found
    assert_equal({ "error" => "Not found" }, response.parsed_body)
  end
end
