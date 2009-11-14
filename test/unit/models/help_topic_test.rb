require File.dirname(__FILE__) + '/../test_helper'

class HelpTopicTest < ActiveSupport::TestCase
  test "should load index page by default" do
    File.expects(:read).with(regexp_matches(/index/)).returns("Test page\nTest content")
    topic = HelpTopic.from_param!("")
    assert_equal "Test page", topic.title
    assert_equal "Test content", topic.text
  end
  
  test "should load arbitrary page" do
    File.expects(:read).with(regexp_matches(/some_page/)).returns("Test page\nTest content")
    topic = HelpTopic.from_param!("some_page")
    assert_equal "Test page", topic.title
    assert_equal "Test content", topic.text
  end
  
  test "should not freak out when help file is blank" do
    File.expects(:read).with(regexp_matches(/index/)).returns("")
    topic = HelpTopic.from_param!("")
    assert_equal "", topic.title
    assert_equal "", topic.text
  end
  
  test "should use topic as param" do
    topic = HelpTopic.from_param!("")
    assert_equal "index", topic.to_param
  end
  
  test "should raise ARNF if topic is not found" do
    assert_raise ActiveRecord::RecordNotFound do
      File.expects(:read).raises(Errno::ENOENT)
      HelpTopic.from_param!("doesnt_exist")
    end
  end
end
