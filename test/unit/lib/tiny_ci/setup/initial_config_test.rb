require File.dirname(__FILE__) + '/../../../test_helper'

class TinyCI::Setup::InitialConfigTest < ActiveSupport::TestCase
  test "should use default values when instantiated without parameters" do
    config = TinyCI::Setup::InitialConfig.new
    assert_equal 'root', config.db_user
    assert_equal 'localhost', config.db_host
    assert_equal 'tiny_ci_production', config.db_name
  end
  
  test "should use values provided to initialize when instantiated with parameter hash" do
    config = TinyCI::Setup::InitialConfig.new(:db_user => 'someone', :db_password => 'abcdef', :db_host => 'somehost')
    assert_equal 'someone', config.db_user
    assert_equal 'abcdef', config.db_password
    assert_equal 'somehost', config.db_host
  end
  
  test "should raise NoMethodError when non-existent attribute is supplied to initialize" do
    assert_raise NoMethodError do
      TinyCI::Setup::InitialConfig.new(:some_key => 'some_value')
    end
  end
  
  test "should try connection with database first" do
    config = TinyCI::Setup::InitialConfig.new
    config.stubs(:write_config)
    config.stubs(:setup_database)
    ActiveRecord::Base.expects(:establish_connection).with(has_entry(:database => 'tiny_ci_production'))
    ActiveRecord::Base.connection.expects(:active?).returns(true)
    assert config.save
  end
  
  test "should try connection without database second" do
    tries = states('tries').starts_as('first')

    config = TinyCI::Setup::InitialConfig.new
    config.stubs(:write_config)
    config.stubs(:setup_database)
    
    ActiveRecord::Base.expects(:establish_connection).with(has_entry(:database => 'tiny_ci_production'))
    ActiveRecord::Base.connection.expects(:active?).raises(Mysql::Error).then(tries.is('second'))
    
    ActiveRecord::Base.expects(:establish_connection).with(has_entry(:database => nil)).when(tries.is('second'))
    ActiveRecord::Base.connection.expects(:active?).returns(true).when(tries.is('second'))
    
    assert config.save
  end
  
  test "should fail if no connection attempt succeeded" do
    tries = states('tries').starts_as('first')

    config = TinyCI::Setup::InitialConfig.new
    config.stubs(:write_config)
    config.stubs(:setup_database)
    
    ActiveRecord::Base.expects(:establish_connection).twice
    ActiveRecord::Base.connection.expects(:active?).raises(Mysql::Error).twice
    
    assert ! config.save
  end
  
  test "should write configuration files" do
    config = TinyCI::Setup::InitialConfig.new
    config.stubs(:try_connection).returns(true)
    config.stubs(:setup_database)
    
    file_object = stub
    file_object.expects(:print).at_least_once
    File.stubs(:open).yields(file_object)
    File.stubs(:read).returns('some text')
    
    assert config.save
  end
  
  test "should initialize database" do
    config = TinyCI::Setup::InitialConfig.new
    config.stubs(:try_connection).returns(true)
    config.stubs(:write_config)
    
    config.expects(:system).with('rake db:create:all db:migrate')
    
    assert config.save
  end
end
