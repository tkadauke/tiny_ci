Given /^a project "([^\"]*)"$/ do |project_name|
  Project.create!(:name => project_name)
end
