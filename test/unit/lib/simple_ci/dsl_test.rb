require File.dirname(__FILE__) + '/../../test_helper'

class SimpleCI::DSLTest < ActiveSupport::TestCase
  module ::SimpleCI::SourceControl
    class Test
      def initialize(build, options)
      end
    end
  end
  
  test "should add environment variables" do
    env = {}
    build = stub(:environment => env)
    SimpleCI::DSL.new(build).env('some_key' => 'some_value')
    
    assert_equal 'some_value', env['some_key']
  end
  
  test "should set source control system" do
    build = mock(:source_control=)
    SimpleCI::DSL.new(build).repository(:test)
  end
  
  test "should update repository" do
    build = stub
    SimpleCI::Steps::SourceControl::Update.expects(:new).with(build, {}).returns(mock(:run!))
    SimpleCI::DSL.new(build).update
  end
  
  test "should run rake task" do
    build = stub
    SimpleCI::Steps::Builder::Rake.expects(:new).with(build, ['test'], {}).returns(mock(:run!))
    SimpleCI::DSL.new(build).rake 'test'
  end
  
  test "should extract environment variables from rake options" do
    build = stub
    SimpleCI::Steps::Builder::Rake.expects(:new).with(build, ['test'], { 'some_key' => 'some_value' }).returns(mock(:run!))
    SimpleCI::DSL.new(build).rake 'test', 'some_key' => 'some_value'
  end
end
