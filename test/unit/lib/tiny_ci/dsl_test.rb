require File.dirname(__FILE__) + '/../../test_helper'

class TinyCI::DSLTest < ActiveSupport::TestCase
  module ::TinyCI::SourceControl
    class Test
      def initialize(build, options)
      end
    end
  end
  
  test "should add environment variables" do
    env = {}
    build = stub(:environment => env)
    TinyCI::DSL.new(build).env('some_key' => 'some_value')
    
    assert_equal 'some_value', env['some_key']
  end
  
  test "should set source control system" do
    build = mock(:source_control=)
    TinyCI::DSL.new(build).repository(:test)
  end
  
  test "should update repository" do
    build = stub
    TinyCI::Steps::SourceControl::Update.expects(:new).with(build, {}).returns(mock(:run!))
    TinyCI::DSL.new(build).update
  end
  
  test "should run shell command" do
    shell = mock
    shell.expects(:run).with('ls', ['-l', '-a'], '/some/path', { 'some_key' => 'some_value' })
    build = stub(:shell => shell, :workspace_path => '/some/path', :environment => { 'some_key' => 'some_value' })
    TinyCI::DSL.new(build).sh 'ls', '-l', '-a'
  end
  
  test "should evaluate steps" do
    build = stub(:plan => mock(:steps => 'rake'), :repository_url => 'ssh://some/url')
    TinyCI::DSL.any_instance.expects(:repository).with(:git)
    TinyCI::DSL.any_instance.expects(:update)
    TinyCI::DSL.any_instance.expects(:rake)
    TinyCI::DSL.evaluate(build)
  end
end
