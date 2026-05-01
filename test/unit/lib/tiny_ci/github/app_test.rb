require_relative "../../../../test_helper"

class TinyCI::GitHub::AppTest < ActiveSupport::TestCase
  TEST_KEY = OpenSSL::PKey::RSA.generate(2048).to_pem

  setup do
    Rails.cache = ActiveSupport::Cache::MemoryStore.new
    ENV["GITHUB_APP_ID"]              = "1234"
    ENV["GITHUB_APP_PRIVATE_KEY"]     = TEST_KEY
    ENV.delete("GITHUB_APP_PRIVATE_KEY_PATH")
  end

  teardown do
    Rails.cache = ActiveSupport::Cache::NullStore.new
    ENV.delete("GITHUB_APP_ID")
    ENV.delete("GITHUB_APP_PRIVATE_KEY")
    ENV.delete("GITHUB_APP_PRIVATE_KEY_PATH")
  end

  test "configured? reflects app id and private key presence" do
    assert TinyCI::GitHub.configured?
    ENV.delete("GITHUB_APP_PRIVATE_KEY")
    refute TinyCI::GitHub.configured?
  end

  test "private_key_pem prefers PATH when readable" do
    Tempfile.create(["app", ".pem"]) do |f|
      f.write(TEST_KEY)
      f.close
      ENV["GITHUB_APP_PRIVATE_KEY_PATH"] = f.path
      ENV["GITHUB_APP_PRIVATE_KEY"]      = "ignored"
      assert_equal TEST_KEY, TinyCI::GitHub::App.private_key_pem
    end
  end

  test "installation_token caches across calls" do
    fake = stub(token: "ghs_abc")
    octokit = mock
    octokit.expects(:create_app_installation_access_token).with(42).returns(fake).once
    TinyCI::GitHub::App.stubs(:jwt_client).returns(octokit)

    assert_equal "ghs_abc", TinyCI::GitHub::App.installation_token(42)
    assert_equal "ghs_abc", TinyCI::GitHub::App.installation_token(42) # cached
  end
end
