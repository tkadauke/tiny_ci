require_relative "../../../test_helper"

class TinyCI::Scheduler::ClientTest < ActiveSupport::TestCase
  test "stop sets the build status to stopping" do
    build = stub
    build.expects(:update).with(status: "stopping")

    TinyCI::Scheduler::Client.stop(build)
  end
end
