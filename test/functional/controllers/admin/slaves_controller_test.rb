require_relative "../../test_helper"
class Admin::SlavesControllerTest < ActionController::TestCase
  test "should render index page" do
    Slave.create(:name => 'some_slave', :protocol => 'localhost')
    
    get :index
    assert_response :success
  end
  
  test "should show slave" do
    slave = Slave.create(:name => 'some_slave', :protocol => 'localhost')
    
    get :show, params: { id: slave.name }
    assert_response :success
  end
  
  test "should raise record not found if slave does not exist" do
    Slave.create(:name => 'some_slave', :protocol => 'localhost')

    assert_raise ActiveRecord::RecordNotFound do
      get :show, params: { id: 'no-such-slave' }
    end
  end
  
  test "should show new" do
    get :new
    assert_response :success
  end
  
  test "should clone slave" do
    slave = Slave.create(:name => 'some_slave', :protocol => 'localhost')
    
    get :new, params: { clone: slave.name }
    assert_response :success
  end
  
  test "should create slave" do
    assert_difference 'Slave.count' do
      post :create, params: { slave: { name: 'some_slave', protocol: 'localhost' } }
      assert_response :redirect
      assert_not_nil flash[:notice]
    end
  end

  test "should not create invalid slave" do
    assert_no_difference 'Slave.count' do
      post :create, params: { slave: { name: '' } }
      assert_response :unprocessable_content
      assert_nil flash[:notice]
    end
  end

  test "should show edit" do
    slave = Slave.create(:name => 'some_slave', :protocol => 'localhost')
    
    get :edit, params: { id: slave.name }
    assert_response :success
  end
  
  test "should update slave" do
    slave = Slave.create(:name => 'some_slave', :protocol => 'localhost')

    post :update, params: { id: slave.name, slave: { name: 'some_slave', protocol: 'ssh' } }
    assert_response :redirect
    assert_not_nil flash[:notice]
  end

  test "should not update invalid slave" do
    slave = Slave.create(:name => 'some_slave', :protocol => 'localhost')

    post :update, params: { id: slave.name, slave: { name: 'some_slave', protocol: nil } }
    assert_response :unprocessable_content
    assert_nil flash[:notice]
  end

  test "should destroy slave" do
    slave = Slave.create(:name => 'some_slave', :protocol => 'localhost')

    assert_difference 'Slave.count', -1 do
      delete :destroy, params: { id: slave.name }
      assert_response :redirect
      assert_not_nil flash[:notice]
    end
  end
end
