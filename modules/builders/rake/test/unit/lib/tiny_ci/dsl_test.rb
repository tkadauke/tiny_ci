require File.expand_path(File.dirname(__FILE__) + '/../../test_helper')

class TinyCI::DSLTest < ActiveSupport::TestCase
  test "should run rake task" do
    build = stub(:workspace_path => '/')
    TinyCI::Steps::Builder::Rake.expects(:new).with(build, ['test'], '/', {}).returns(mock(:run!))
    TinyCI::DSL.new(build).rake 'test'
  end

  test "should extract environment variables from rake options" do
    build = stub(:workspace_path => '/')
    TinyCI::Steps::Builder::Rake.expects(:new).with(build, ['test'], '/', { 'some_key' => 'some_value' }).returns(mock(:run!))
    TinyCI::DSL.new(build).rake 'test', 'some_key' => 'some_value'
  end
end
