module TinyCI
  class Config
    include Singleton
    
    attr_reader :config
    
    def config
      @config ||= YAML.load(ERB.new(File.read("#{RAILS_ROOT}/config/options.yml")).result).stringify_keys
    end
    
    def reload!
      @config = nil
    end
    
    class << self
      def method_missing(method)
        if instance.config[method.to_s]
          instance.config[method.to_s]
        else
          super
        end
      end
    end
  end
end
