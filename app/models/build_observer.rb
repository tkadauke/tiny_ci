class BuildObserver < ActiveRecord::Observer
  def after_update(build)
    if build.previous_changes.has_key?('output')
      Juggernaut.send_to_channel("Report.update()", "build_#{build.name}_#{build.position}")
    end
  end
end
