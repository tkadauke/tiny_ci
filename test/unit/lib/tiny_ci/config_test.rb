require File.dirname(__FILE__) + '/../../test_helper'

class TinyCI::ConfigTest < ActiveSupport::TestCase
  def setup
    TinyCI::Config.instance.reload!
  end
  
  test "should load config from YAML file" do
    File.expects(:read).returns([{ 'hello' => { 'default' => 'world' } }].to_yaml)
    assert_equal 'world', TinyCI::Config.hello
  end

  test "should evaluate embedded ERB in config" do
    File.expects(:read).returns([{ 'hello' => { 'type' => 'String', 'default' => '<%= "world".upcase %>' } }].to_yaml)
    assert_equal 'WORLD', TinyCI::Config.hello
  end

  test "should raise NoMethodError if config option does not exist" do
    File.expects(:read).returns([{ 'hello' => { 'default' => 'world' } }].to_yaml)
    assert_raise NoMethodError do
      TinyCI::Config.foobar
    end
  end
  
  test "should get option from default" do
    File.expects(:read).returns([{ 'hello' => { 'type' => 'String', 'default' => 'world' } }].to_yaml)
    assert_equal 'world', TinyCI::Config.instance.get('hello')
  end
  
  test "should get option from database" do
    ConfigOption.expects(:find_by_user_id_and_key).returns(stub(:key => 'hello', :value => 'universe'.to_yaml))
    File.expects(:read).returns([{ 'hello' => { 'type' => 'String', 'default' => 'world' } }].to_yaml)
    assert_equal 'universe', TinyCI::Config.instance.get('hello')
  end
  
  test "should set option" do
    option = stub(:key => 'hello', :value => 'universe'.to_yaml)
    option.expects(:update_attribute).with(:value, 'galaxy'.to_yaml)
    ConfigOption.expects(:find_or_create_by_user_id_and_key).returns(option)
    File.expects(:read).returns([{ 'hello' => { 'type' => 'String', 'default' => 'world' } }].to_yaml)
    
    TinyCI::Config.instance.set('hello', 'galaxy')
  end
  
  test "should set several options at once" do
    TinyCI::Config.instance.expects(:set).twice
    TinyCI::Config.instance.update_attributes('hello' => 'galaxy', 'foo' => 'bar')
  end
  
  test "should type cast to integer when reading" do
    ConfigOption.expects(:find_by_user_id_and_key).returns(stub(:key => 'hello', :value => '15'.to_yaml))
    File.expects(:read).returns([{ 'hello' => { 'type' => 'Integer' } }].to_yaml)
    assert_equal 15, TinyCI::Config.hello
  end
  
  test "should type cast to integer when writing" do
    option = stub(:key => 'hello')
    option.expects(:update_attribute).with(:value, 42.to_yaml)
    ConfigOption.expects(:find_or_create_by_user_id_and_key).returns(option)
    File.expects(:read).returns([{ 'hello' => { 'type' => 'Integer', 'default' => 15 } }].to_yaml)
    
    TinyCI::Config.instance.set('hello', 42)
  end
  
  test "should type cast to hash" do
    ConfigOption.expects(:find_by_user_id_and_key).returns(stub(:key => 'hello', :value => { 'foo' => 'bar' }.to_yaml))
    File.expects(:read).returns([{ 'hello' => { 'type' => 'Hash' } }].to_yaml)
    assert_equal({ 'foo' => 'bar' }, TinyCI::Config.hello)
  end
  
  test "should extract options" do
    File.expects(:read).returns([
      { 'hello' => { 'type' => 'String', 'default' => 'world' } },
      { 'foo' => { 'type' => 'String', 'default' => 'baz' } }
    ].to_yaml)
    options = TinyCI::Config.instance.options
    assert_equal 2, options.size
    assert_equal 'hello', options.first.key
    assert_equal 'String', options.first.type
    assert_equal 'world', options.first.default
  end
end
