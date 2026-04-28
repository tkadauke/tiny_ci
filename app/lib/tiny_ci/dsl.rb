module TinyCI
  # Stub: the original DSL `instance_eval`s plan steps as Ruby. That is an RCE
  # vector flagged in the modernization roadmap and will be replaced before we
  # re-enable build execution. See docs/modernize.md §3.6.
  class DSL
    def self.evaluate(_build)
      raise NotImplementedError, "TinyCI::DSL is not ported to modern Rails yet"
    end
  end
end
