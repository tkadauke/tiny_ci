Given /^a plan "([^\"]*)" in project "([^\"]*)"$/ do |plan_name, project_name|
  project = Project.find_by_name!(project_name)
  project.plans.create!(:name => plan_name)
end