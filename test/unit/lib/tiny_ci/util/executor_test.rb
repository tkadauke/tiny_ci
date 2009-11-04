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
end
