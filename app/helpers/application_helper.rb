# Methods added to this helper will be available to all templates in the application.
module ApplicationHelper
  BREAD_CRUMB_MODELS = {
    'projects' => Project,
    'plans'    => Plan,
    'builds'   => Build,
    'users'    => User,
    'slaves'   => Slave
  }.freeze

  BREAD_CRUMB_ASSOCIATIONS = %w[plans builds].freeze

  def duration(dur)
    dur = dur.to_i
    seconds = dur % 60
    dur /= 60
    minutes = dur % 60
    dur /= 60
    hours = dur % 24
    dur /= 24
    days = dur
    
    [[days, t('duration.days')], [hours, t('duration.hours')], [minutes, t('duration.minutes')], [seconds, t('duration.seconds')]].reject { |part| part.first == 0 }.collect { |part| part.join(' ') }.join(', ')
  end
  
  # Both auto_update (the Rails 2 periodically_call_remote helper) and
  # juggernaut (the Flash WebSocket push helper) are gone — replaced by
  # turbo_stream_from + Build broadcasting refreshes via Turbo. The
  # remaining old call sites still in views were updated to use
  # turbo_stream_from directly.
  
  def bread_crumb
    parts = [link_to(I18n.t('breadcrumb.home'), '/')]
    sofar = ''
    elements = request.path.split('/')
    parent_model = nil
    (1...elements.size).each do |i|
      sofar += '/' + elements[i]

      parent_model, link_text = begin
        next_model = if parent_model
          assoc = elements[i - 1]
          raise ArgumentError unless BREAD_CRUMB_ASSOCIATIONS.include?(assoc)
          parent_model.public_send(assoc).from_param!(elements[i])
        else
          klass = BREAD_CRUMB_MODELS[elements[i - 1]]
          raise ArgumentError unless klass
          klass.from_param!(elements[i])
        end
        [next_model, next_model.to_param]
      rescue StandardError
        [parent_model, I18n.t("breadcrumb.#{elements[i]}")]
      end

      parts << link_to(link_text, sofar)
    end
    safe_join(parts, ' > '.html_safe)
  end
end
