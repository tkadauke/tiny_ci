require_relative "../../../test_helper"

class TinyCI::DSL::ValidatorTest < ActiveSupport::TestCase
  def assert_allowed(source)
    assert TinyCI::DSL::Validator.validate!(source), "expected to allow: #{source.inspect}"
  end

  def assert_rejected(source, reason: nil)
    error = assert_raise(SecurityError) { TinyCI::DSL::Validator.validate!(source) }
    if reason
      assert_match(reason, error.message, "wrong rejection reason for: #{source.inspect}")
    end
  end

  # ---- allowed ----

  test "allows empty steps" do
    assert_allowed ""
    assert_allowed "  \n\n  "
  end

  test "allows the seven allowlisted method calls with literal args" do
    assert_allowed %(sh "echo hello")
    assert_allowed %(rake :test)
    assert_allowed %(cap "deploy")
    assert_allowed %(env "FOO" => "bar")
    assert_allowed %(repository :git)
    assert_allowed "update"
  end

  test "allows cd with a block containing more allowed calls" do
    assert_allowed <<~RUBY
      cd "subdir" do
        sh "make"
        rake :test
      end
    RUBY
  end

  test "allows array and hash literals as arguments" do
    assert_allowed %(rake :a, :b, :c)
    assert_allowed %(rake "test", "FOO" => "bar")
  end

  # ---- rejected: out-of-allowlist methods ----

  test "rejects bare system" do
    assert_rejected %(system "rm -rf /"), reason: /system.*allowlist/
  end

  test "rejects Kernel.system via explicit receiver" do
    assert_rejected %(Kernel.system "rm -rf /"), reason: /receiver/
  end

  test "rejects eval" do
    assert_rejected %(eval "puts 1+1"), reason: /eval.*allowlist/
  end

  test "rejects exec / spawn / backticks" do
    assert_rejected %(exec "ls")
    assert_rejected %(spawn "ls")
    assert_rejected '`ls`'
  end

  test "rejects File.read / Dir.glob etc" do
    assert_rejected %(File.read("/etc/passwd")), reason: /receiver/
    assert_rejected %(Dir.glob("/")), reason: /receiver/
  end

  # ---- rejected: dangerous syntax ----

  test "rejects def" do
    assert_rejected "def attack; end"
  end

  test "rejects class definition" do
    assert_rejected "class Foo; end"
  end

  test "rejects module definition" do
    assert_rejected "module Foo; end"
  end

  test "rejects constant access" do
    assert_rejected "Object"
    assert_rejected "TinyCI::DSL"
  end

  test "rejects instance / global / class variables" do
    assert_rejected "@build"
    assert_rejected "$stdout"
    assert_rejected "@@foo"
  end

  test "rejects rescue blocks" do
    assert_rejected <<~RUBY
      begin
        sh "x"
      rescue
        sh "y"
      end
    RUBY
  end

  test "rejects local variable assignment" do
    assert_rejected %(x = "hi"; sh x)
  end

  test "rejects yield" do
    assert_rejected "yield"
  end

  test "rejects if/unless/case control flow" do
    assert_rejected 'if true; sh "x"; end'
  end

  test "rejects block parameters" do
    assert_rejected <<~RUBY
      cd "x" do |arg|
        sh "y"
      end
    RUBY
  end

  test "rejects blocks on methods other than cd" do
    assert_rejected <<~RUBY
      sh "echo" do
        sh "y"
      end
    RUBY
  end

  test "rejects parse errors with a clear message" do
    assert_rejected "sh 'unterminated", reason: /did not parse|allowed|allowlist/
  end

  test "rejects string interpolation in arguments" do
    # `"hi #{1+1}"` — the EmbeddedStatementsNode has a CallNode inside,
    # which is rejected because + isn't allowlisted (and even if it were,
    # we don't allow arbitrary expressions in arguments).
    assert_rejected 'sh "hi #{1+1}"'
  end
end
