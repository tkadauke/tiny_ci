require File.expand_path(File.dirname(__FILE__) + '/../../../test_helper')

class TinyCI::Notifier::EmailNotifierTest < ActiveSupport::TestCase
  def setup
    @recipient = stub
    @build = stub
  end
  
  test "should deliver success" do
    BuildMailer.expects(:deliver_success).with(@recipient, @build)
    TinyCI::Notifier::EmailNotifier.new(@recipient).success(@build)
  end

  test "should deliver failure" do
    BuildMailer.expects(:deliver_failure).with(@recipient, @build)
    TinyCI::Notifier::EmailNotifier.new(@recipient).failure(@build)
  end
end
