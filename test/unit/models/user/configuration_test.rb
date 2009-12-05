require File.dirname(__FILE__) + '/../../test_helper'

class User::ConfigurationTest < ActiveSupport::TestCase
  test "should get user id on initialization" do
    user = mock(:id => 7)
    config = User::Configuration.new(user)
  end
end
