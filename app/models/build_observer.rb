class BuildObserver < ActiveRecord::Observer
  def after_create(build)
    Juggernaut.send_to_channel("Queue.update()", "queue")
  end
  
  def after_update(build)
    if build.previous_changes.has_key?('output') || build.previous_changes.has_key?('status')
      Juggernaut.send_to_channel("Report.update()", "build_#{build.name}_#{build.position}")
    end
    
    if build.previous_changes.has_key?('status')
      Juggernaut.send_to_channel("Queue.update()", "queue")
      TinyCI::Notifier::Base.notify(build)
    end
  end
end
