require_relative "../test_helper"

class I18nTest < ActiveSupport::TestCase
  test "should suffix every translation containing HTML markup with _html" do
    I18n.backend.send(:init_translations) unless I18n.backend.initialized?

    offenders = []
    walk_translations(I18n.backend.send(:translations)) do |path, value|
      next unless value.is_a?(String)
      next unless value.include?("<")
      next if path.any? { |segment| segment.to_s.end_with?("_html") }

      offenders << path.join(".")
    end

    assert_empty offenders, <<~MSG
      The following translation keys contain HTML markup but are not
      suffixed with _html. Rails will HTML-escape them at render time.
      Rename each key (and its call sites) to end in _html:

      #{offenders.join("\n")}
    MSG
  end

  private

  def walk_translations(node, path = [], &block)
    case node
    when Hash
      node.each { |k, v| walk_translations(v, path + [k], &block) }
    when Array
      node.each_with_index { |v, i| walk_translations(v, path + [i], &block) }
    else
      yield path, node
    end
  end
end
