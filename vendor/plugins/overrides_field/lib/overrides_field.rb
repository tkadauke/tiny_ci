module OverridesField
  module ClassMethods
    def overrides_field(*fields)
      options = fields.extract_options!
      
      fields.each do |field|
        override_field field, options
      end
    end
    
    def override_field(field, options)
      from = options[:from]
      condition = options[:if]
      
      define_method field do |*skip_default|
        super.blank? && !skip_default.first ? send("default_#{field}") : super
      end
      
      define_method "default_#{field}" do
        source = eval(from.to_s)
        if source
          if condition && condition.call(self) || !condition
            source.send(field)
          else
            nil
          end
        else
          nil
        end
      end
    end
  end
  
  module InstanceMethods
    
  end
  
  def self.included(receiver)
    receiver.extend         ClassMethods
    receiver.send :include, InstanceMethods
  end
end
