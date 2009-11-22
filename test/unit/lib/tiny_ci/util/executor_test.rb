require File.dirname(__FILE__) + '/../../../test_helper'

class TinyCI::Util::ExecutorTest < ActiveSupport::TestCase
  class TestExecutor
    include TinyCI::Util::Executor
    def initialize(build)
      @build = build
    end
  end
  
  def setup
    @shell = stub
    @build = stub(:shell => @shell, :workspace_path => '/some/path', :environment => {})
  end
  
  test "should run command" do
    @shell.expects(:run).with('ls', '-l', '/some/path', {})
    
    TestExecutor.new(@build).run('ls', '-l')
  end
  
  test "should find out if file exists" do
    @shell.expects(:exists?).with('/some/file', '/some/path')
    
    TestExecutor.new(@build).exists?('/some/file')
  end

  test "should capture command output" do
    @shell.expects(:capture).with('/some/command', '/some/path')
    
    TestExecutor.new(@build).capture('/some/command')
  end
  
  test "should make directory" do
    @shell.expects(:mkdir).with('/some/directory')
    
    TestExecutor.new(@build).mkdir('/some/directory')
  end
end
