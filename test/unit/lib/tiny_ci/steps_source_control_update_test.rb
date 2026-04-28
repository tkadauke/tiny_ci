require_relative "../../../test_helper"

class TinyCI::Steps::SourceControl::UpdateTest < ActiveSupport::TestCase
  test "should delegate update to source control object" do
    build = stub
    update = TinyCI::Steps::SourceControl::Update.new(build)
    build.expects(:source_control).returns(stub(update: nil))
    update.execute!
  end
end
