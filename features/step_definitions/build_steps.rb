Given /^a running build of plan "([^\"]*)" in project "([^\"]*)" on slave "([^\"]*)"$/ do |plan_name, project_name, slave_name|
  slave = Slave.find_by_name!(slave_name)
  project = Project.find_by_name!(project_name)
  plan = project.plans.find_by_name!(plan_name)
  plan.builds.create!(:status => 'running', :slave => slave, :started_at => 2.minutes.ago)
end

Given /^a successfully finished build of plan "([^\"]*)" in project "([^\"]*)" on slave "([^\"]*)"$/ do |plan_name, project_name, slave_name|
  slave = Slave.find_by_name!(slave_name)
  project = Project.find_by_name!(project_name)
  plan = project.plans.find_by_name!(plan_name)
  plan.builds.create!(:status => 'success', :slave => slave, :started_at => 2.minutes.ago, :finished_at => 2.seconds.ago)
  plan.update_build_stats!
end

Given /^a successfully finished build of plan "([^\"]*)" in project "([^\"]*)"$/ do |plan_name, project_name|
  project = Project.find_by_name!(project_name)
  plan = project.plans.find_by_name!(plan_name)
  plan.builds.create!(:status => 'success', :started_at => 2.minutes.ago, :finished_at => 2.seconds.ago)
  plan.update_build_stats!
end

Given /^a pending build of plan "([^\"]*)" in project "([^\"]*)"$/ do |plan_name, project_name|
  project = Project.find_by_name!(project_name)
  plan = project.plans.find_by_name!(plan_name)
  plan.builds.create!(:status => 'pending')
end
