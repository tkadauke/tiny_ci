Given /^a plan "([^\"]*)" in project "([^\"]*)"$/ do |plan_name, project_name|
  project = Project.find_by_name!(project_name)
  project.plans.create!(:name => plan_name)
end

Given /^a child plan "([^\"]*)" of parent "([^\"]*)" in project "([^\"]*)"$/ do |plan_name, parent_name, project_name|
  project = Project.find_by_name!(project_name)
  parent = project.plans.find_by_name!(parent_name)
  project.plans.create!(:name => plan_name, :parent => parent)
end