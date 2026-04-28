module OverridesField
  extend ActiveSupport::Concern

  class_methods do
    def overrides_field(*fields)
      options = fields.extract_options!
      fields.each { |field| override_field(field, options) }
    end

    def override_field(field, options)
      from = options[:from]
      condition = options[:if]

      define_method field do |*skip_default|
        original = super()
        if original.blank? && skip_default.first != true
          send("default_#{field}")
        else
          original
        end
      end

      define_method "default_#{field}" do
        source =
          case from
          when Symbol then send(from)
          when String then from.constantize
          else from
          end
        return nil unless source
        return source.send(field) if condition.nil? || condition.call(self)
        nil
      end
    end
  end
end
