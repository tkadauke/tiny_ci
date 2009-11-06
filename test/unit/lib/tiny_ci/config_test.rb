require File.dirname(__FILE__) + '/../../test_helper'

class TinyCI::ConfigTest < ActiveSupport::TestCase
  def setup
    TinyCI::Config.instance.reload!
  end
  
  test "should load config from YAML file" do
    File.expects(:read).returns({ 'hello' => 'world' }.to_yaml)
    assert_equal 'world', TinyCI::Config.hello
  end

  test "should evaluate embedded ERB in config" do
    File.expects(:read).returns("--- \nhello: <%= 'world'.upcase %>\n")
    assert_equal 'WORLD', TinyCI::Config.hello
  end

  test "should not care if config keys are hashes" do
    File.expects(:read).returns({ :hello => 'world' }.to_yaml)
    assert_equal 'world', TinyCI::Config.hello
  end
end
