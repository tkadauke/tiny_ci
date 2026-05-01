require_relative "../../../test_helper"

class TinyCI::BuildConfigTest < ActiveSupport::TestCase
  test "should parse minimal valid config" do
    config = TinyCI::BuildConfig.parse(<<~YAML)
      stages:
        - name: test
          run: bundle exec rspec
    YAML

    assert_nil config.language
    assert_nil config.language_version
    assert_equal 1, config.stages.size
    assert_equal "test", config.stages.first.name
    assert_equal "bundle exec rspec", config.stages.first.run
    assert_equal [], config.secrets
    assert_equal({}, config.resources)
  end

  test "should parse fully populated config" do
    config = TinyCI::BuildConfig.parse(<<~YAML)
      language: ruby
      language_version: "3.3"
      stages:
        - name: setup
          run: bundle install
        - name: test
          run: bundle exec rspec
      secrets:
        - DATABASE_URL
        - DEPLOY_KEY
      resources:
        cpu: 2
        memory: 2Gi
    YAML

    assert_equal "ruby", config.language
    assert_equal "3.3", config.language_version
    assert_equal %w[setup test], config.stages.map(&:name)
    assert_equal ["bundle install", "bundle exec rspec"], config.stages.map(&:run)
    assert_equal %w[DATABASE_URL DEPLOY_KEY], config.secrets
    assert_equal({ "cpu" => 2, "memory" => "2Gi" }, config.resources)
  end

  test "should coerce numeric language_version to string" do
    config = TinyCI::BuildConfig.parse(<<~YAML)
      language: ruby
      language_version: 3.3
      stages:
        - name: test
          run: ls
    YAML

    assert_equal "3.3", config.language_version
  end

  test "should reject missing stages" do
    assert_raises_parse_error(/`stages` is required/) do
      TinyCI::BuildConfig.parse("language: ruby\n")
    end
  end

  test "should reject empty stages list" do
    assert_raises_parse_error(/`stages` must be a non-empty list/) do
      TinyCI::BuildConfig.parse("stages: []\n")
    end
  end

  test "should reject stage without run" do
    assert_raises_parse_error(/stages\[0\]\.run is required/) do
      TinyCI::BuildConfig.parse(<<~YAML)
        stages:
          - name: test
      YAML
    end
  end

  test "should reject stage with blank run" do
    assert_raises_parse_error(/stages\[0\]\.run must not be blank/) do
      TinyCI::BuildConfig.parse(<<~YAML)
        stages:
          - name: test
            run: "   "
      YAML
    end
  end

  test "should reject stage without name" do
    assert_raises_parse_error(/stages\[0\]\.name is required/) do
      TinyCI::BuildConfig.parse(<<~YAML)
        stages:
          - run: ls
      YAML
    end
  end

  test "should reject stage name with invalid characters" do
    assert_raises_parse_error(/stages\[0\]\.name must match/) do
      TinyCI::BuildConfig.parse(<<~YAML)
        stages:
          - name: "rm -rf /"
            run: ls
      YAML
    end
  end

  test "should reject unknown top-level keys" do
    assert_raises_parse_error(/top-level has unknown key\(s\): bogus/) do
      TinyCI::BuildConfig.parse(<<~YAML)
        bogus: true
        stages:
          - name: test
            run: ls
      YAML
    end
  end

  test "should reject unknown stage keys" do
    assert_raises_parse_error(/stages\[0\] has unknown key\(s\): timeout/) do
      TinyCI::BuildConfig.parse(<<~YAML)
        stages:
          - name: test
            run: ls
            timeout: 60
      YAML
    end
  end

  test "should reject non-array secrets" do
    assert_raises_parse_error(/`secrets` must be a list of non-empty strings/) do
      TinyCI::BuildConfig.parse(<<~YAML)
        stages:
          - name: test
            run: ls
        secrets:
          - ""
      YAML
    end
  end

  test "should reject malformed yaml" do
    assert_raises_parse_error(/invalid YAML/) do
      TinyCI::BuildConfig.parse("stages: [\n")
    end
  end

  test "should reject non-mapping top level" do
    assert_raises_parse_error(/top-level must be a mapping/) do
      TinyCI::BuildConfig.parse("- one\n- two\n")
    end
  end

  test "should reject non-array stages" do
    assert_raises_parse_error(/`stages` must be a non-empty list/) do
      TinyCI::BuildConfig.parse("stages: not-a-list\n")
    end
  end

  test "should not load from a directory missing tiny_ci.yml" do
    Dir.mktmpdir do |dir|
      assert_nil TinyCI::BuildConfig.load(dir)
    end
  end

  test "should load from a directory containing tiny_ci.yml" do
    Dir.mktmpdir do |dir|
      File.write(File.join(dir, "tiny_ci.yml"), <<~YAML)
        stages:
          - name: test
            run: bundle exec rspec
      YAML

      config = TinyCI::BuildConfig.load(dir)
      assert_equal "test", config.stages.first.name
    end
  end

  test "should reject yaml that uses aliases" do
    yaml = <<~YAML
      defaults: &defaults
        run: ls
      stages:
        - <<: *defaults
          name: test
    YAML
    assert_raises TinyCI::BuildConfig::ParseError do
      TinyCI::BuildConfig.parse(yaml)
    end
  end

  private

  def assert_raises_parse_error(message)
    error = assert_raises(TinyCI::BuildConfig::ParseError) { yield }
    assert_match message, error.message
  end
end
