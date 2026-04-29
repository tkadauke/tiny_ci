require "prism"

module TinyCI
  class DSL
    # Static validator for the user-supplied build-step source. Walks the
    # Prism AST and rejects anything outside a strict allowlist before the
    # source is fed to instance_eval. The legacy DSL accepted arbitrary
    # Ruby (RCE-from-DB); this brings it down to a small, declarative
    # subset:
    #
    #   sh "echo"            # shell command
    #   rake :test           # rake task
    #   cap "deploy"         # capistrano task
    #   cd "subdir" do … end # change pwd, optionally with a block
    #   env "FOO" => "bar"   # add to environment
    #   repository :git      # set the SCM
    #   update               # run the SCM update step
    #
    # Allowed argument shapes: string literals (with no interpolation),
    # symbols, integers, true/false/nil, arrays of those, and hashes whose
    # keys and values are also literals. No method calls in arguments. No
    # constants, ivars, gvars, def/class/module, eval, control flow,
    # rescues, or yields. No bare `system`, `Kernel.system`, etc — the
    # `sh` helper is the only way to run a command.
    #
    # If validation fails, Validator.validate! raises SecurityError with
    # a message naming the first offending node. Callers should rescue
    # that and mark the build failed.
    class Validator
      ALLOWED_METHODS = %i[sh rake cap cd env repository update].freeze
      METHODS_WITH_BLOCK = %i[cd].freeze

      def self.validate!(source)
        new(source).validate!
      end

      def initialize(source)
        @source = source.to_s
      end

      def validate!
        result = Prism.parse(@source)
        if result.failure?
          raise SecurityError, "Plan steps did not parse: #{result.errors.first&.message}"
        end
        walk(result.value)
        true
      end

      private

      def walk(node)
        case node
        when Prism::ProgramNode, Prism::StatementsNode
          children(node).each { |c| walk(c) }
        when Prism::CallNode
          validate_call!(node)
        when Prism::ArgumentsNode
          children(node).each { |c| walk_arg(c) }
        when Prism::BlockNode
          # Block parameters and body. The DSL doesn't yield anything to
          # block parameters, so reject any params.
          if node.parameters && node.parameters.respond_to?(:parameters) && node.parameters.parameters
            reject!(node.parameters, "block parameters are not allowed")
          end
          walk(node.body) if node.body
        else
          reject!(node, "node type #{node.class.name.split('::').last} is not allowed in plan steps")
        end
      end

      # Argument-position rules: literals only, plus hash literals and
      # arrays of literals.
      def walk_arg(node)
        case node
        when Prism::StringNode, Prism::SymbolNode, Prism::IntegerNode, Prism::FloatNode,
             Prism::TrueNode, Prism::FalseNode, Prism::NilNode
          # plain literals
        when Prism::ArrayNode
          children(node).each { |c| walk_arg(c) }
        when Prism::HashNode, Prism::KeywordHashNode
          children(node).each { |c| walk_arg(c) }
        when Prism::AssocNode
          walk_arg(node.key)
          walk_arg(node.value)
        else
          reject!(node, "argument of type #{node.class.name.split('::').last} is not allowed")
        end
      end

      def validate_call!(node)
        if node.receiver
          reject!(node, "method calls with an explicit receiver (#{node.receiver.class.name.split('::').last}) are not allowed")
        end
        unless ALLOWED_METHODS.include?(node.name)
          reject!(node, "method `#{node.name}` is not in the allowlist (allowed: #{ALLOWED_METHODS.join(', ')})")
        end
        if node.block && !METHODS_WITH_BLOCK.include?(node.name)
          reject!(node, "method `#{node.name}` does not take a block")
        end
        walk(node.arguments) if node.arguments
        walk(node.block) if node.block
      end

      def children(node)
        node.compact_child_nodes
      end

      def reject!(node, reason)
        line = node.location&.start_line
        prefix = line ? "line #{line}: " : ""
        raise SecurityError, "#{prefix}#{reason}"
      end
    end
  end
end
