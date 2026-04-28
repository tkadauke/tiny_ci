module TinyCI
  class BaseConfig
    class Option
      attr_reader :key, :name, :description, :type, :default, :values

      def initialize(key, hash)
        @key = key
        %w[name description type default values].each do |var|
          instance_variable_set(:"@#{var}", hash[var])
        end
      end
    end

    def config
      @config ||= YAML.load(ERB.new(File.read(config_file_name)).result)
    end

    def reload!
      @config = nil
    end

    def options
      keys.collect { |key| option(key) }
    end

    def option(key)
      Option.new(key.to_s, find_option(key.to_s))
    end

    def keys
      config.collect { |opt| opt.keys.first }
    end

    def get(key)
      option = option(key)
      db_option = get_config_option(key)
      if db_option
        type_cast(YAML.load(db_option.value), option.type)
      else
        option.default
      end
    end

    def set(key, value)
      option = option(key)
      set_config_option(key, type_cast(value, option.type))
    end

    def update(attributes = {})
      attributes.each { |key, value| set(key, value) }
      true
    end

    def method_missing(method)
      if find_option(method.to_s)
        get(method.to_s)
      else
        super
      end
    end

    def respond_to_missing?(method, include_private = false)
      !find_option(method.to_s).nil? || super
    end

    private

    def config_file_name
      base = @user_id ? "user_options.yml" : "options.yml"
      Rails.root.join("config", base).to_s
    end

    def get_config_option(key)
      ConfigOption.find_by(user_id: @user_id, key: key)
    end

    def set_config_option(key, value)
      db_option = ConfigOption.find_or_create_by(user_id: @user_id, key: key.to_s)
      db_option.update(value: value.to_yaml)
    end

    def find_option(key)
      config.find { |opt| opt.keys.first == key }&.values&.first
    end

    def type_cast(value, type)
      case type
      when "String"  then value
      when "Integer" then value.to_i
      when "Hash"    then value
      end
    end
  end
end
