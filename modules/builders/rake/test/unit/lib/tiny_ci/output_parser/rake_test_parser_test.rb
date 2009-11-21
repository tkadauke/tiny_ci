require File.expand_path(File.dirname(__FILE__) + '/../../../test_helper')

class TinyCI::OutputParser::RakeTestParserTest < ActiveSupport::TestCase
  test "should parse until eof" do
    output = TinyCI::Output.new('1,rake,some output')
    result = TinyCI::OutputParser::RakeTestParser.parse(output)
    assert_equal 'some output', result.raw_output.first.line
    assert_equal 1, result.raw_output.size
  end

  test "should break when a new task is invoked" do
    output = TinyCI::Output.new("1,rake,some output\n2,rake,** Invoke some:task")
    result = TinyCI::OutputParser::RakeTestParser.parse(output)
    assert_equal 1, result.raw_output.size
  end
  
  test "should break when a new task is executed" do
    output = TinyCI::Output.new("1,rake,some output\n2,rake,** Execute some:task")
    result = TinyCI::OutputParser::RakeTestParser.parse(output)
    assert_equal 1, result.raw_output.size
  end
  
  test "should parse successful test case" do
    output = TinyCI::Output.new("1,rake,test_should_do_something(SomeTest): .")
    result = TinyCI::OutputParser::RakeTestParser.parse(output)
    assert_not_nil result.tests['SomeTest']
    assert_not_nil result.tests['SomeTest'].test_cases.first
    assert_equal 'success', result.tests['SomeTest'].test_cases.first.status
    assert_equal 'test_should_do_something', result.tests['SomeTest'].test_cases.first.name
  end
  
  test "should parse failed test case" do
    output = TinyCI::Output.new("1,rake,test_should_do_something(SomeTest): F")
    result = TinyCI::OutputParser::RakeTestParser.parse(output)
    assert_not_nil result.tests['SomeTest']
    assert_not_nil result.tests['SomeTest'].test_cases.first
    assert_equal 'failure', result.tests['SomeTest'].test_cases.first.status
    assert_equal 'test_should_do_something', result.tests['SomeTest'].test_cases.first.name
  end
  
  test "should parse test case with error" do
    output = TinyCI::Output.new("1,rake,test_should_do_something(SomeTest): E")
    result = TinyCI::OutputParser::RakeTestParser.parse(output)
    assert_not_nil result.tests['SomeTest']
    assert_not_nil result.tests['SomeTest'].test_cases.first
    assert_equal 'error', result.tests['SomeTest'].test_cases.first.status
    assert_equal 'test_should_do_something', result.tests['SomeTest'].test_cases.first.name
  end
  
  test "should calculate test duration" do
    output = TinyCI::Output.new("1,rake,test_should_do_something(SomeTest): .\n2,rake,test_should_do_something_else(SomeTest): .")
    result = TinyCI::OutputParser::RakeTestParser.parse(output)
    assert_equal 1, result.tests['SomeTest'].test_cases.first.duration
  end
  
  test "should ignore non-well-formed test cases" do
    ["test_should_do_something(SomeTest): X", "test_should_do_something: .", "should_do_something(SomeTest): ."].each do |line|
      output = TinyCI::Output.new("1,rake,#{line}")
      result = TinyCI::OutputParser::RakeTestParser.parse(output)
      assert_nil result.tests['SomeTest']
    end
  end
  
  test "should parse total time" do
    output = TinyCI::Output.new("1,rake,Finished in 1.2345 seconds.")
    result = TinyCI::OutputParser::RakeTestParser.parse(output)
    assert_equal "1.2345", result.summary.total_time
  end
  
  test "should parse statistics" do
    output = TinyCI::Output.new("1,rake,\"1 tests, 2 assertions, 3 failures, 4 errors\"")
    result = TinyCI::OutputParser::RakeTestParser.parse(output)
    assert_equal "1", result.summary.tests
    assert_equal "2", result.summary.assertions
    assert_equal "3", result.summary.failures
    assert_equal "4", result.summary.errors
  end
  
  test "should parse failure" do
    output = TinyCI::Output.new("1,rake,test_should_do_something(SomeTest): F\n2,rake,1) Failure:\n2,rake,test_should_do_something(SomeTest)\n2,rake,[/some/path/some_test.rb:22:in `foo'\n2,rake,/some/other/path/some_runner.rb:1:in `foo']:\n2,rake,\"<false> is not true,\"\n2,rake,you know?")
    result = TinyCI::OutputParser::RakeTestParser.parse(output)
    assert_equal "<false> is not true, you know?", result.test_case('SomeTest', 'test_should_do_something').error_message
    assert_equal [["/some/path/some_test.rb", "22", "in `foo'"], ["/some/other/path/some_runner.rb", "1", "in `foo'"]], result.test_case('SomeTest', 'test_should_do_something').backtrace
  end
  
  test "should parse failure even when output stream stops in the middle" do
    output = TinyCI::Output.new("1,rake,test_should_do_something(SomeTest): F\n2,rake,1) Failure:\n2,rake,test_should_do_something(SomeTest)\n2,rake,[/some/path/some_test.rb:22:in `foo'")
    result = TinyCI::OutputParser::RakeTestParser.parse(output)
    assert_equal "", result.test_case('SomeTest', 'test_should_do_something').error_message
    assert_equal [["/some/path/some_test.rb", "22", "in `foo'"]], result.test_case('SomeTest', 'test_should_do_something').backtrace
  end
  
  test "should parse error" do
    output = TinyCI::Output.new("1,rake,test_should_do_something(SomeTest): E\n2,rake,1) Error:\n2,rake,test_should_do_something(SomeTest)\n2,rake,Exception!!!\n2,rake,/some/path/some_test.rb:22:in `foo'\n2,rake,/some/other/path/some_runner.rb:1:in `foo'")
    result = TinyCI::OutputParser::RakeTestParser.parse(output)
    assert_equal "Exception!!!", result.test_case('SomeTest', 'test_should_do_something').error_message
    assert_equal [["/some/path/some_test.rb", "22", "in `foo'"], ["/some/other/path/some_runner.rb", "1", "in `foo'"]], result.test_case('SomeTest', 'test_should_do_something').backtrace
  end
  
  test "should parse error even when backtrace is missing" do
    output = TinyCI::Output.new("1,rake,test_should_do_something(SomeTest): E\n2,rake,1) Error:\n2,rake,test_should_do_something(SomeTest)\n2,rake,Exception!!!")
    result = TinyCI::OutputParser::RakeTestParser.parse(output)
    assert_equal "Exception!!!", result.test_case('SomeTest', 'test_should_do_something').error_message
    assert_equal [], result.test_case('SomeTest', 'test_should_do_something').backtrace
  end
end
