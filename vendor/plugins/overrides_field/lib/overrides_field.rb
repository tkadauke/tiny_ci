module OverridesField
  module ClassMethods
    def overrides_field(*fields)
      options = fields.extract_options!
      
      fields.each do |field|
        override_field field, options[:from]
      end
    end
    
    def override_field(field, from)
      define_method field do |*skip_default|
        super.blank? && !skip_default.first ? send("default_#{field}") : super
      end
      
      define_method "default_#{field}" do
        source = eval(from.to_s)
        (source ? source.send(field) : nil)
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
