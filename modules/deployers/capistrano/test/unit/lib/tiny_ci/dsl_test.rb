require File.expand_path(File.dirname(__FILE__) + '/../../test_helper')

class TinyCI::DSLTest < ActiveSupport::TestCase
  test "should run capistrano task" do
    build = stub(:workspace_path => '/')
    TinyCI::Steps::Deployer::Capistrano.expects(:new).with(build, ['test'], '/', {}).returns(mock(:run!))
    TinyCI::DSL.new(build).cap 'test'
  end

  test "should extract environment variables from capistrano options" do
    build = stub(:workspace_path => '/')
    TinyCI::Steps::Deployer::Capistrano.expects(:new).with(build, ['test'], '/', { 'some_key' => 'some_value' }).returns(mock(:run!))
    TinyCI::DSL.new(build).cap 'test', 'some_key' => 'some_value'
  end
end
