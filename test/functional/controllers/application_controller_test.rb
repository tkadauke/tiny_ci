require_relative "../test_helper"

class ApplicationControllerTest < ActionController::TestCase
  class TestController < ApplicationController
    before_action :require_user, only: :user_action

    def user_action
      render plain: "OK"
    end
  end

  tests TestController

  setup do
    Rails.application.routes.draw do
      get "/login", to: "user_sessions#new", as: :login
      get "user_action", to: "application_controller_test/test#user_action"
      root to: "start#index"
    end
  end

  teardown do
    Rails.application.reload_routes!
  end

  test "should run action if user required and logged in" do
    login_with create_user
    get :user_action
    assert_response :success
  end

  test "should redirect if user required but not logged in" do
    get :user_action
    assert_response :redirect
  end
end
