require_relative "../../../../test_helper"

class TinyCI::TelegramBot::NotifierTest < ActiveSupport::TestCase
  setup do
    ENV["TINY_CI_BOT_TELEGRAM_TOKEN"] = "bot-token-123"
    ENV["TINY_CI_PUBLIC_URL"]         = "https://ci.example.com"

    @project = Project.create!(name: "raytracer", telegram_chat_id: "-100999")
    @plan    = @project.plans.create!(name: "main")
  end

  teardown do
    ENV.delete("TINY_CI_BOT_TELEGRAM_TOKEN")
    ENV.delete("TINY_CI_PUBLIC_URL")
  end

  test "configured? is true when token is set" do
    assert TinyCI::TelegramBot.configured?
    ENV.delete("TINY_CI_BOT_TELEGRAM_TOKEN")
    refute TinyCI::TelegramBot.configured?
  end

  test "skips silently when bot token is absent" do
    ENV.delete("TINY_CI_BOT_TELEGRAM_TOKEN")
    Net::HTTP.expects(:post).never
    TinyCI::TelegramBot::Notifier.notify(build_stub(status: "failure"))
  end

  test "skips when project has no telegram_chat_id" do
    @project.update!(telegram_chat_id: nil)
    Net::HTTP.expects(:post).never
    TinyCI::TelegramBot::Notifier.notify(make_build(status: "failure"))
  end

  test "notifies on failed build" do
    Net::HTTP.expects(:post).once.returns(stub(body: '{"ok":true}'))
    TinyCI::TelegramBot::Notifier.notify(make_build(status: "failure"))
  end

  test "notifies on error build" do
    Net::HTTP.expects(:post).once.returns(stub(body: '{"ok":true}'))
    TinyCI::TelegramBot::Notifier.notify(make_build(status: "error"))
  end

  test "notifies on back-to-green (success after failure)" do
    bad = make_build(status: "failure", finished_at: 10.minutes.ago)
    good = make_build(status: "success")
    Net::HTTP.expects(:post).once.returns(stub(body: '{"ok":true}'))
    TinyCI::TelegramBot::Notifier.notify(good)
  end

  test "silent on success after success" do
    make_build(status: "success", finished_at: 10.minutes.ago)
    good = make_build(status: "success")
    Net::HTTP.expects(:post).never
    TinyCI::TelegramBot::Notifier.notify(good)
  end

  test "notifies on very first success (no previous builds)" do
    build = make_build(status: "success")
    Net::HTTP.expects(:post).once.returns(stub(body: '{"ok":true}'))
    TinyCI::TelegramBot::Notifier.notify(build)
  end

  test "message includes project/plan name and dashboard URL" do
    captured_body = nil
    Net::HTTP.stubs(:post) do |_uri, body, _headers|
      captured_body = JSON.parse(body)
      stub(body: '{"ok":true}')
    end
    TinyCI::TelegramBot::Notifier.notify(make_build(status: "failure"))

    assert_equal "-100999", captured_body["chat_id"]
    assert_match(/raytracer/, captured_body["text"])
    assert_match(/main/, captured_body["text"])
    assert_match(%r{ci\.example\.com}, captured_body["text"])
  end

  test "message includes thread_id when set" do
    @project.update!(telegram_thread_id: 42)
    captured_body = nil
    Net::HTTP.stubs(:post) do |_uri, body, _headers|
      captured_body = JSON.parse(body)
      stub(body: '{"ok":true}')
    end
    TinyCI::TelegramBot::Notifier.notify(make_build(status: "failure"))
    assert_equal 42, captured_body["message_thread_id"]
  end

  test "logs and swallows network errors" do
    Net::HTTP.stubs(:post).raises(SocketError, "connection refused")
    Rails.logger.expects(:error).with(regexp_matches(/notify failed/))
    assert_nothing_raised { TinyCI::TelegramBot::Notifier.notify(make_build(status: "failure")) }
  end

  private

  def make_build(status:, finished_at: nil)
    @plan.builds.create!(
      status:      status,
      finished_at: finished_at || (status.in?(%w[success failure error canceled stopped]) ? Time.current : nil)
    )
  end

  def build_stub(status:)
    stub(
      id: 0, project: @project, plan: @plan, status: status,
      good?: status == "success", bad?: status != "success",
      duration: nil, to_param: "1"
    )
  end
end
