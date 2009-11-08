require File.dirname(__FILE__) + '/../../../test_helper'

class TinyCI::SourceControl::GitTest < ActiveSupport::TestCase
  test "should do the update workflow" do
    git = TinyCI::SourceControl::Git.new(stub, {})
    git.expects(:clone_or_update)
    git.expects(:find_or_checkout_revision)
    git.expects(:update_submodules)
    git.update
  end
  
  test "should clone repository" do
    build = stub(:name => 'some_plan', :repository_url => '/some/url')
    git = TinyCI::SourceControl::Git.new(build, {})
    TinyCI::Config.stubs(:base_path)
    git.expects(:exists?).returns(false)
    git.expects(:run).with("git", "clone /some/url some_plan", anything)
    git.send :clone_or_update
  end
  
  test "should update repository" do
    build = stub
    git = TinyCI::SourceControl::Git.new(build, {})
    git.expects(:exists?).returns(true)
    git.expects(:run).with("git", "pull origin master")
    git.send :clone_or_update
  end
  
  test "should find out revision" do
    build = stub(:revision => nil)
    build.expects(:update_attributes).with(:revision => '12345')
    
    git = TinyCI::SourceControl::Git.new(build, {})
    git.expects(:capture).returns('12345')
    git.send :find_or_checkout_revision
  end
  
  test "should check out revision" do
    build = stub(:revision => '12345')
    
    git = TinyCI::SourceControl::Git.new(build, {})
    git.expects(:run).with("git", "checkout -f 12345")
    git.send :find_or_checkout_revision
  end
  
  test "should update submodules" do
    git = TinyCI::SourceControl::Git.new(stub, {})
    git.expects(:run).with("git", "submodule init")
    git.expects(:run).with("git", "submodule update")
    git.send :update_submodules
  end
end
