require File.dirname(__FILE__) + '/../../../../test_helper'

class TinyCI::Steps::SourceControl::UpdateTest < ActiveSupport::TestCase
  test "should delegate update to source control object" do
    build = stub
    update = TinyCI::Steps::SourceControl::Update.new(build)
    build.expects(:source_control).returns(mock(:update))
    update.execute!
  end
end
