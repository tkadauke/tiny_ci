require_relative "../../../../../test_helper"

class TinyCI::Steps::Deployer::CapistranoTest < ActiveSupport::TestCase
  test "should execute the named tasks via cap" do
    cap = TinyCI::Steps::Deployer::Capistrano.new(stub, %w[deploy:cold], "/")
    cap.expects(:run).with("cap", %w[deploy:cold], "/", {})
    cap.execute!
  end

  test "should pass environment variables through" do
    cap = TinyCI::Steps::Deployer::Capistrano.new(stub, ["deploy"], "/", "STAGE" => "prod")
    cap.expects(:run).with("cap", ["deploy"], "/", { "STAGE" => "prod" })
    cap.execute!
  end
end
