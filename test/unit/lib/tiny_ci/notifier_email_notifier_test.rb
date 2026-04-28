require_relative "../../../test_helper"

class TinyCI::Notifier::EmailNotifierTest < ActiveSupport::TestCase
  setup do
    @recipient = stub
    @build = stub
  end

  test "should deliver success" do
    message = stub(deliver_now: nil)
    BuildMailer.expects(:success).with(@recipient, @build).returns(message)
    message.expects(:deliver_now)

    TinyCI::Notifier::EmailNotifier.new(@recipient).success(@build)
  end

  test "should deliver failure" do
    message = stub(deliver_now: nil)
    BuildMailer.expects(:failure).with(@recipient, @build).returns(message)
    message.expects(:deliver_now)

    TinyCI::Notifier::EmailNotifier.new(@recipient).failure(@build)
  end
end
