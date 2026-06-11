require_relative "../test_helper"

class ApiFoundationTestController < Api::BaseController
  def create
    render json: { ok: true }
  end
end

class ApiFoundationTest < ActionDispatch::IntegrationTest
  setup do
    @allow_forgery_protection = ActionController::Base.allow_forgery_protection
    ActionController::Base.allow_forgery_protection = true

    Rails.application.routes.draw do
      namespace :api do
        get "csrf", to: "csrf#token"
        post "csrf_echo", to: "/api_foundation_test#create"
      end
    end
  end

  teardown do
    ActionController::Base.allow_forgery_protection = @allow_forgery_protection
    Rails.application.reload_routes!
  end

  test "csrf token from api endpoint is accepted on post" do
    get "/api/csrf"
    assert_response :success
    token = JSON.parse(@response.body)["token"]

    post "/api/csrf_echo",
         params: { name: "test" }.to_json,
         headers: {
           "CONTENT_TYPE" => "application/json",
           "X-CSRF-Token" => token
         }

    assert_response :success
    assert_equal({ "ok" => true }, JSON.parse(@response.body))
  end
end
