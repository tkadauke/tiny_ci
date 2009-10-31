class BuildObserver < ActiveRecord::Observer
  def after_update(build)
    if build.previous_changes.has_key?(:status) && build.finished?
      SimpleCI::Scheduler::Client.finished(self)
    end
  end
end
