require File.dirname(__FILE__) + '/../../test_helper'

class Admin::SlavesControllerTest < ActionController::TestCase
  test "should render index page" do
    Slave.create(:name => 'some_slave', :protocol => 'localhost')
    
    get 'index'
    assert_response :success
  end
  
  test "should show slave" do
    slave = Slave.create(:name => 'some_slave', :protocol => 'localhost')
    
    get 'show', :id => slave
    assert_response :success
  end
  
  test "should raise record not found if slave does not exist" do
    slave = Slave.create(:name => 'some_slave', :protocol => 'localhost')
    
    assert_raise ActiveRecord::RecordNotFound do
      get 'show', :id => nil
    end
  end
  
  test "should show new" do
    get 'new'
    assert_response :success
  end
  
  test "should clone slave" do
    slave = Slave.create(:name => 'some_slave', :protocol => 'localhost')
    
    get 'new', :clone => slave
    assert_response :success
  end
  
  test "should create slave" do
    assert_difference 'Slave.count' do
      post 'create', :slave => { :name => 'some_slave', :protocol => 'localhost' }
      assert_response :redirect
      assert_not_nil flash[:notice]
    end
  end

  test "should not create invalid slave" do
    assert_no_difference 'Slave.count' do
      post 'create'
      assert_response :success
      assert_nil flash[:notice]
    end
  end

  test "should show edit" do
    slave = Slave.create(:name => 'some_slave', :protocol => 'localhost')
    
    get 'edit', :id => slave
    assert_response :success
  end
  
  test "should update slave" do
    slave = Slave.create(:name => 'some_slave', :protocol => 'localhost')

    post 'update', :id => slave, :slave => { :name => 'some_slave', :protocol => 'ssh' }
    assert_response :redirect
    assert_not_nil flash[:notice]
  end

  test "should not update invalid slave" do
    slave = Slave.create(:name => 'some_slave', :protocol => 'localhost')

    post 'update', :id => slave, :slave => { :name => 'some_slave', :protocol => nil }
    assert_response :success
    assert_nil flash[:notice]
  end
end
