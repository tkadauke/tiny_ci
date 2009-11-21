require File.dirname(__FILE__) + '/../../../test_helper'

class TinyCI::Notifier::BaseTest < ActiveSupport::TestCase
  class TestNotifer < TinyCI::Notifier::Base
  end
  
  test "should deliver success" do
    build = stub(:good? => true, :bad? => false)
    TestNotifer.any_instance.expects(:success).with(build)
    TinyCI::Notifier::Base.notify(build)
  end
  
  test "should deliver failure" do
    build = stub(:good? => false, :bad? => true)
    TestNotifer.any_instance.expects(:failure).with(build)
    TinyCI::Notifier::Base.notify(build)
  end
  
  test "should require subclass for success or failure" do
    assert_raise NotImplementedError do
      TinyCI::Notifier::Base.new.success(stub)
    end
    
    assert_raise NotImplementedError do
      TinyCI::Notifier::Base.new.failure(stub)
    end
  end
end
