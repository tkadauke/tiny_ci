require File.dirname(__FILE__) + '/../../../test_helper'

class TinyCI::Notifier::BaseTest < ActiveSupport::TestCase
  class TestNotifier < TinyCI::Notifier::Base
  end
  
  def setup
    User.stubs(:all).returns([stub])
  end
  
  test "should deliver success" do
    build = stub(:good? => true, :bad? => false)
    TinyCI::Notifier::Base.expects(:subclasses).returns(TestNotifier.to_s)
    TestNotifier.any_instance.expects(:success).with(build)
    TinyCI::Notifier::Base.notify_without_background(build)
  end
  
  test "should deliver failure" do
    build = stub(:good? => false, :bad? => true)
    TinyCI::Notifier::Base.expects(:subclasses).returns(TestNotifier.to_s)
    TestNotifier.any_instance.expects(:failure).with(build)
    TinyCI::Notifier::Base.notify_without_background(build)
  end
  
  test "should require subclass for success or failure" do
    assert_raise NotImplementedError do
      TinyCI::Notifier::Base.new(stub).success(stub)
    end
    
    assert_raise NotImplementedError do
      TinyCI::Notifier::Base.new(stub).failure(stub)
    end
  end
  
  test "should log exceptions" do
    RAILS_DEFAULT_LOGGER.expects(:info).with('abc')
    
    build = stub(:good? => true, :bad? => false)
    TinyCI::Notifier::Base.expects(:subclasses).returns(TestNotifier.to_s)
    TestNotifier.any_instance.expects(:success).with(build).raises(StandardError.new('abc'))
    TinyCI::Notifier::Base.notify_without_background(build)
  end
end
