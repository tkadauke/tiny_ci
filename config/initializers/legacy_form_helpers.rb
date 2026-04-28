# Rails 3 removed `f.error_messages` from FormBuilder. The TinyCI views still
# use it; restore it as a thin polyfill so the legacy templates render.
ActiveSupport.on_load(:action_view) do
  ActionView::Helpers::FormBuilder.class_eval do
    def error_messages(_options = {})
      return "".html_safe unless object.respond_to?(:errors)
      return "".html_safe if object.errors.empty?

      messages = object.errors.full_messages
      header = "#{messages.size} error#{"s" if messages.size != 1} prevented this from being saved:"
      list = messages.map { |m| @template.content_tag(:li, m) }.join

      @template.content_tag(:div, class: "errorExplanation") do
        @template.content_tag(:h2, header) +
          @template.content_tag(:ul, list.html_safe)
      end
    end
  end
end
