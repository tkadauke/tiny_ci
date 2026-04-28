require_relative "../../../test_helper"

class TinyCI::Notifier::BaseTest < ActiveSupport::TestCase
  class TestNotifier < TinyCI::Notifier::Base
  end

  setup do
    User.stubs(:all).returns([stub])
  end

  test "should deliver success" do
    build = stub(good?: true, bad?: false)
    TinyCI::Notifier::Base.expects(:notifiers).returns([TestNotifier]).at_least_once
    TestNotifier.any_instance.expects(:success).with(build)

    TinyCI::Notifier::Base.notify(build)
  end

  test "should deliver failure" do
    build = stub(good?: false, bad?: true)
    TinyCI::Notifier::Base.expects(:notifiers).returns([TestNotifier]).at_least_once
    TestNotifier.any_instance.expects(:failure).with(build)

    TinyCI::Notifier::Base.notify(build)
  end

  test "should require subclass for success or failure" do
    assert_raise NotImplementedError do
      TinyCI::Notifier::Base.new(stub).success(stub)
    end

    assert_raise NotImplementedError do
      TinyCI::Notifier::Base.new(stub).failure(stub)
    end
  end

  test "should log exceptions raised by a notifier" do
    logger = stub
    logger.expects(:error).with("abc").once
    logger.expects(:error).with(regexp_matches(/notifier/)).once
    Rails.stubs(:logger).returns(logger)

    build = stub(good?: true, bad?: false)
    TinyCI::Notifier::Base.expects(:notifiers).returns([TestNotifier]).at_least_once
    TestNotifier.any_instance.expects(:success).with(build).raises(StandardError.new("abc"))

    TinyCI::Notifier::Base.notify(build)
  end
end
