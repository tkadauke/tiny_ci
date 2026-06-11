class Api::Admin::ConfigurationsController < Api::BaseController
  before_action :require_user
  before_action :can_configure_system_variables!

  def options
    render json: option_metadata(TinyCI::Config.instance)
  end

  def create
    TinyCI::Config.instance.update(params[:config].to_unsafe_h)
    render json: { ok: true }
  end

  private

  def option_metadata(config)
    config.options.reject { |option| option.type == "Hash" }.map do |option|
      {
        key: option.key,
        name: localized_value(option.name),
        description: localized_value(option.description),
        type: option.type,
        values: option.values,
        current_value: config.get(option.key)
      }
    end
  end

  def localized_value(value)
    return nil if value.nil?
    return value[I18n.locale.to_s] || value.values.first if value.respond_to?(:key?)

    value
  end
end
