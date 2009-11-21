require File.expand_path(File.dirname(__FILE__) + '/../../../test_helper')

class TinyCI::Notifier::EmailNotifierTest < ActiveSupport::TestCase
  test "should deliver success" do
    build = stub
    BuildMailer.expects(:deliver_success).with(build)
    TinyCI::Notifier::EmailNotifier.new.success(build)
  end

  test "should deliver failure" do
    build = stub
    BuildMailer.expects(:deliver_failure).with(build)
    TinyCI::Notifier::EmailNotifier.new.failure(build)
  end
end
