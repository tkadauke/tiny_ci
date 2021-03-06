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
  
  def auto_update(container)
    periodically_call_remote(:url => request.request_uri, :update => container, :method => 'get')
  end
  
  def bread_crumb
    breadcrumb = %{<a href="/">#{I18n.t('breadcrumb.home')}</a>}
    sofar = ''
    elements = request.request_uri.split('?').first.split('/')
    parent_model = nil
    for i in 1...elements.size
      sofar += '/' + elements[i]
      
      parent_model, link_text = begin
        next_model = if parent_model
          parent_model.instance_eval("#{elements[i - 1]}.from_param!('#{elements[i]}')")
        else
          eval("#{elements[i - 1].singularize.camelize}.from_param!('#{elements[i]}')")
        end
        [next_model, next_model.to_param]
      rescue Exception => e
        [parent_model, I18n.t("breadcrumb.#{elements[i]}")]
      end
        
      breadcrumb += ' &gt; '
      breadcrumb += "<a href='#{sofar}'>"  + link_text + '</a>'
    end
    breadcrumb
  end
end
