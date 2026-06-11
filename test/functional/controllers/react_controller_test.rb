require_relative "../test_helper"

class ReactControllerTest < ActionController::TestCase
  setup do
    Rails.application.routes.draw do
      get "*path", to: "react#index"
    end
  end

  teardown do
    Rails.application.reload_routes!
  end

  test "should render application layout with react mount" do
    get :index, params: { path: "signup" }

    assert_response :success
    assert_select "#root[data-react-app=?]", "true"
    assert_select "#wrap", false
  end
end
