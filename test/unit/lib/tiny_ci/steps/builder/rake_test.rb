require File.dirname(__FILE__) + '/../../../../test_helper'

class TinyCI::Steps::Builder::RakeTest < ActiveSupport::TestCase
  test "should execute default task" do
    rake = TinyCI::Steps::Builder::Rake.new(stub, [])
    rake.expects(:run).with('rake', any_parameters)
    rake.execute!
  end
  
  test "should execute one task" do
    rake = TinyCI::Steps::Builder::Rake.new(stub, ['test'])
    rake.expects(:run).with('rake', includes('test'), any_parameters)
    rake.execute!
  end
  
  test "should execute more than one task" do
    rake = TinyCI::Steps::Builder::Rake.new(stub, ['test', 'rdoc'])
    rake.expects(:run).with('rake', all_of(includes('test'), includes('rdoc')), any_parameters)
    rake.execute!
  end
  
  test "should trace tasks" do
    rake = TinyCI::Steps::Builder::Rake.new(stub, [])
    rake.expects(:run).with('rake', includes('--trace'), any_parameters)
    rake.execute!
  end
  
  test "should set TESTOPTS environment variable" do
    rake = TinyCI::Steps::Builder::Rake.new(stub, [])
    rake.expects(:run).with('rake', anything, anything, has_entry('TESTOPTS' => '-v'))
    rake.execute!
  end
end
