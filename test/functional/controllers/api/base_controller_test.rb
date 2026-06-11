require_relative "../../test_helper"

class Api::BaseControllerTest < ActionController::TestCase
  class TestController < Api::BaseController
    before_action :require_user, only: :create
    before_action :can_create_accounts!, only: :destroy

    def create
      render json: { ok: true }
    end

    def destroy
      render json: { ok: true }
    end
  end

  tests TestController

  setup do
    Rails.application.routes.draw do
      namespace :api do
        post "protected", to: "base_controller_test/test#create"
        delete "admin_only", to: "base_controller_test/test#destroy"
      end
      root to: "react#index"
    end
  end

  teardown do
    Rails.application.reload_routes!
  end

  test "should render json unauthorized for unauthenticated api mutation" do
    post :create, as: :json

    assert_response :unauthorized
    assert_equal({ "error" => "Not authenticated" }, JSON.parse(@response.body))
  end

  test "should render json forbidden for api permission failure" do
    login_with create_user

    delete :destroy, as: :json

    assert_response :forbidden
    assert_equal({ "error" => "Access denied" }, JSON.parse(@response.body))
  end
end
