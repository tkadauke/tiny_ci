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
    
    [[days, 'days'], [hours, 'hours'], [minutes, 'minutes'], [seconds, 'seconds']].reject { |part| part.first == 0 }.collect { |part| part.join(' ') }.join(', ')
  end
end
