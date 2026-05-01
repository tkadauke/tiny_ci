require "yaml"

module TinyCI
  # Declarative build configuration parsed from `tiny_ci.yml` at the repo
  # root (read at the build's SHA, so config evolves with the code). The
  # legacy path stores Ruby-DSL build steps in the database; the runner
  # falls back to that path when no `tiny_ci.yml` is present (see
  # TinyCI::DSL.evaluate). #88 tracks the full migration.
  #
  # Shape:
  #
  #   language: ruby
  #   language_version: "3.3"
  #   stages:
  #     - name: setup
  #       run: bundle install
  #     - name: test
  #       run: bundle exec rspec
  #   secrets:
  #     - DATABASE_URL
  #   resources:
  #     cpu: 2
  #     memory: 2Gi
  #
  # `stages` is required; everything else is optional. Unknown top-level
  # keys are rejected so typos surface immediately rather than silently
  # being ignored.
  class BuildConfig
    FILENAME = "tiny_ci.yml".freeze

    TOP_LEVEL_KEYS = %w[language language_version stages secrets resources].freeze
    STAGE_KEYS = %w[name run].freeze
    RESOURCE_KEYS = %w[cpu memory].freeze
    NAME_FORMAT = /\A[a-zA-Z0-9][a-zA-Z0-9_\-]*\z/.freeze

    class ParseError < StandardError; end

    Stage = Struct.new(:name, :run, keyword_init: true)

    attr_reader :language, :language_version, :stages, :secrets, :resources

    # Read tiny_ci.yml from the given workspace directory. Returns nil if
    # absent (so the runner can decide whether to fall back). Raises
    # ParseError if present but malformed.
    def self.load(workspace_path)
      path = File.join(workspace_path, FILENAME)
      return nil unless File.exist?(path)
      parse(File.read(path), source: path)
    end

    def self.parse(yaml_string, source: FILENAME)
      raw =
        begin
          YAML.safe_load(yaml_string, permitted_classes: [], aliases: false)
        rescue Psych::Exception => e
          raise ParseError, "#{source}: invalid YAML: #{e.message}"
        end

      raise ParseError, "#{source}: top-level must be a mapping" unless raw.is_a?(Hash)

      new(raw, source: source)
    end

    def initialize(raw, source: FILENAME)
      @source = source
      reject_unknown_keys!(raw, TOP_LEVEL_KEYS, "top-level")

      @language = parse_string(raw, "language", required: false)
      @language_version = parse_string(raw, "language_version", required: false, allow_numeric: true)
      @stages = parse_stages(raw)
      @secrets = parse_secrets(raw)
      @resources = parse_resources(raw)
    end

    private

    def parse_stages(raw)
      stages = raw["stages"]
      raise ParseError, error("`stages` is required") if stages.nil?
      raise ParseError, error("`stages` must be a non-empty list") unless stages.is_a?(Array) && stages.any?

      stages.each_with_index.map { |s, i| build_stage(s, i) }
    end

    def build_stage(stage, index)
      where = "stages[#{index}]"
      raise ParseError, error("#{where} must be a mapping") unless stage.is_a?(Hash)
      reject_unknown_keys!(stage, STAGE_KEYS, where)

      name = parse_string(stage, "name", required: true, where: where)
      raise ParseError, error("#{where}.name must match #{NAME_FORMAT.source}") unless name =~ NAME_FORMAT

      run = parse_string(stage, "run", required: true, where: where)
      raise ParseError, error("#{where}.run must not be blank") if run.strip.empty?

      Stage.new(name: name, run: run)
    end

    def parse_secrets(raw)
      secrets = raw["secrets"]
      return [] if secrets.nil?
      unless secrets.is_a?(Array) && secrets.all? { |s| s.is_a?(String) && !s.empty? }
        raise ParseError, error("`secrets` must be a list of non-empty strings")
      end
      secrets
    end

    def parse_resources(raw)
      resources = raw["resources"]
      return {} if resources.nil?
      raise ParseError, error("`resources` must be a mapping") unless resources.is_a?(Hash)
      reject_unknown_keys!(resources, RESOURCE_KEYS, "resources")
      resources
    end

    def parse_string(hash, key, required:, where: "top-level", allow_numeric: false)
      value = hash[key]
      if value.nil?
        raise ParseError, error("#{where}.#{key} is required") if required
        return nil
      end
      value = value.to_s if allow_numeric && (value.is_a?(Integer) || value.is_a?(Float))
      raise ParseError, error("#{where}.#{key} must be a string") unless value.is_a?(String)
      raise ParseError, error("#{where}.#{key} must not be blank") if required && value.strip.empty?
      value
    end

    def reject_unknown_keys!(hash, allowed, where)
      unknown = hash.keys.map(&:to_s) - allowed
      return if unknown.empty?
      raise ParseError, error("#{where} has unknown key(s): #{unknown.sort.join(', ')}")
    end

    def error(message)
      "#{@source}: #{message}"
    end
  end
end
