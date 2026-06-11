require "test_helper"

class AdminSetupJsonTest < ActionDispatch::IntegrationTest
  setup do
    @old_setup = ENV["SETUP"]
    ENV["SETUP"] = "true"
  end

  teardown do
    ENV["SETUP"] = @old_setup
  end

  test "setup state starts with language choice and defaults" do
    get admin_setup_path, as: :json

    assert_response :success
    assert_equal(
      {
        "step" => "choose_language",
        "defaults" => {
          "db_user" => "root",
          "db_host" => "localhost",
          "db_name" => "tiny_ci_production"
        },
        "language" => nil
      },
      response.parsed_body
    )
  end

  test "setup state stores selected language" do
    get admin_setup_path(language: "de"), as: :json

    assert_response :success
    assert_equal "config", response.parsed_body.fetch("step")
    assert_equal "de", response.parsed_body.fetch("language")
  end

  test "setup create returns raw database error as json" do
    config = mock("config")
    config.stubs(:save).returns(false)
    config.stubs(:error_message).returns("raw db error")
    TinyCI::Setup::InitialConfig.expects(:new).returns(config)

    post admin_setup_path, params: { config: { db_user: "root" } }, as: :json

    assert_response :unprocessable_entity
    assert_equal({ "error" => "raw db error" }, response.parsed_body)
  end

  test "setup create returns ok on success" do
    config = mock("config")
    config.stubs(:save).returns(true)
    TinyCI::Setup::InitialConfig.expects(:new).returns(config)

    post admin_setup_path, params: { config: { db_user: "root" } }, as: :json

    assert_response :success
    assert_equal({ "ok" => true }, response.parsed_body)
  end

  test "restart returns json without running the timer in test" do
    Thread.expects(:start).returns(nil)

    get admin_setup_restart_path, as: :json

    assert_response :success
    assert_equal({ "restarting" => true }, response.parsed_body)
  end

  test "redirect json works outside setup mode" do
    ENV["SETUP"] = "false"

    get admin_setup_redirect_path, as: :json

    assert_response :success
    assert_equal({ "ready" => true }, response.parsed_body)
  end
end
