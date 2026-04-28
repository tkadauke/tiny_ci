# Methods added to this helper will be available to all templates in the application.
module ApplicationHelper
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
  
  def auto_update(_container)
    # `periodically_call_remote` was a Rails 2 RJS helper; modern equivalent is
    # Hotwire Turbo Streams or Stimulus. No-op until ported.
    nil
  end

  # Legacy Juggernaut realtime push view helper. The original gem is dead;
  # this stub renders nothing so old views keep working.
  def juggernaut(*) = "".html_safe
  
  def bread_crumb
    parts = [link_to(I18n.t('breadcrumb.home'), '/')]
    sofar = ''
    elements = request.path.split('/')
    parent_model = nil
    (1...elements.size).each do |i|
      sofar += '/' + elements[i]

      parent_model, link_text = begin
        next_model = if parent_model
          parent_model.public_send(elements[i - 1]).from_param!(elements[i])
        else
          elements[i - 1].singularize.camelize.constantize.from_param!(elements[i])
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
