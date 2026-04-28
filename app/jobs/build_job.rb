class BuildJob < ApplicationJob
  queue_as :builds

  def perform(build_id)
    build = Build.find(build_id)
    build.build!

    if build.waiting? && build.plan.has_children?
      build.plan.build_children!(build)
    end
  end
end
