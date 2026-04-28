require_relative "../../test_helper"
class Admin::SetupControllerTest < ActionController::TestCase
  def setup
    ENV['SETUP'] = 'true'
  end
  
  def teardown
    ENV['SETUP'] = 'false'
  end
  
  test "should get index page" do
    skip "Setup wizard view uses legacy form_for(symbol, object, options) signature; will be reworked alongside the TinyCI::Setup port"
  end
end
