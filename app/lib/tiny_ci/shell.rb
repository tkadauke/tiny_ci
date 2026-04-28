module TinyCI
  # Stub: real implementation lives in lib/tiny_ci/shell.rb (legacy code that
  # talks to local processes and remote SSH slaves). Web tier only references
  # `Shell::CommandExecutionFailed` for rescue clauses, so we expose just that.
  module Shell
    class CommandExecutionFailed < StandardError; end

    def self.open(_build)
      raise NotImplementedError, "TinyCI::Shell is not ported to modern Rails yet"
    end
  end
end
