require File.expand_path(File.dirname(__FILE__) + '/../../../test_helper')

class TinyCI::Notifier::GrowlNotifierTest < ActiveSupport::TestCase
  class ::Growl; end
  test "should deliver success" do
    TinyCI::Notifier::GrowlNotifier.any_instance.stubs(:growl_available? => true)
    
    build = stub(:project => stub(:name => 'some_project'), :name => 'some_plan', :position => 7)
    notifier = TinyCI::Notifier::GrowlNotifier.new(stub)
    connection = stub
    connection.expects(:notify).with("TinyCI Notification", "Success", all_of(regexp_matches(/some_project/), regexp_matches(/some_plan/), regexp_matches(/7/)))
    notifier.stubs(:connection).returns(connection)
    notifier.success(build)
  end
  
  test "should deliver failure" do
    TinyCI::Notifier::GrowlNotifier.any_instance.stubs(:growl_available? => true)
    
    build = stub(:project => stub(:name => 'some_project'), :name => 'some_plan', :position => 7, :status => 'failed')
    notifier = TinyCI::Notifier::GrowlNotifier.new(stub)
    connection = stub
    connection.expects(:notify).with("TinyCI Notification", "Failure", all_of(regexp_matches(/some_project/), regexp_matches(/some_plan/), regexp_matches(/7/), regexp_matches(/failed/)))
    notifier.stubs(:connection).returns(connection)
    notifier.failure(build)
  end
  
  test "should not deliver anything if growl not available" do
    TinyCI::Notifier::GrowlNotifier.any_instance.stubs(:growl_available? => false)
    TinyCI::Notifier::GrowlNotifier.any_instance.expects(:connection).never
    
    TinyCI::Notifier::GrowlNotifier.new(stub).success(stub)
    TinyCI::Notifier::GrowlNotifier.new(stub).failure(stub)
  end
end
