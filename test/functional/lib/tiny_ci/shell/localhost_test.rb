require File.dirname(__FILE__) + '/../../../../test_helper'

class TinyCI::Shell::LocalhostTest < ActiveSupport::TestCase
  test "should find directory with exists?" do
    localhost = TinyCI::Shell::Localhost.new(Build.new)
    assert localhost.exists?(File.dirname(__FILE__), RAILS_ROOT)
  end

  test "should find file with exists?" do
    localhost = TinyCI::Shell::Localhost.new(Build.new)
    assert localhost.exists?('localhost_test.rb', File.dirname(__FILE__))
  end

  test "should capture output" do
    localhost = TinyCI::Shell::Localhost.new(Build.new)
    assert localhost.capture('ls', File.dirname(__FILE__)) =~ /localhost_test\.rb/m
  end
end
