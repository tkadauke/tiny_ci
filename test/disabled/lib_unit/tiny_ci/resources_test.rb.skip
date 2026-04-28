require File.dirname(__FILE__) + '/../../test_helper'

class TinyCI::ResourcesTest < ActiveSupport::TestCase
  test "should find out if one set includes another set of numbered resources" do
    super_set = TinyCI::Resources::Parser.parse('5 gb ram, 2 cpu, ruby, rails')
    sub_set = TinyCI::Resources::Parser.parse('2 gb ram, 1 cpu, ruby, rails')
    
    assert super_set.includes?(sub_set)
  end

  test "should ignore unnumbered resources" do
    super_set = TinyCI::Resources::Parser.parse('5 gb ram, 2 cpu')
    sub_set = TinyCI::Resources::Parser.parse('2 gb ram, 1 cpu, ruby, rails')
    
    assert super_set.includes?(sub_set)
  end
  
  test "should find out if one set does not include another set of numbered resources" do
    super_set = TinyCI::Resources::Parser.parse('1 gb ram, 2 cpu, ruby, rails')
    sub_set = TinyCI::Resources::Parser.parse('2 gb ram, 1 cpu, ruby, rails')
    
    assert ! super_set.includes?(sub_set)
  end
  
  test "should include an empty set" do
    super_set = TinyCI::Resources::Parser.parse('1 gb ram, 2 cpu')
    sub_set = TinyCI::Resources::Parser.parse('')
    
    assert super_set.includes?(sub_set)
  end
  
  test "should include an empty set if self is empty" do
    super_set = TinyCI::Resources::Parser.parse('')
    sub_set = TinyCI::Resources::Parser.parse('')
    
    assert super_set.includes?(sub_set)
  end

  test "should not include a non-empty set if self is empty" do
    super_set = TinyCI::Resources::Parser.parse('')
    sub_set = TinyCI::Resources::Parser.parse('1 gb ram, 2 cpu')
    
    assert super_set.includes?(sub_set)
  end
end
