Given /^a worker "([^\"]*)"$/ do |worker_name|
  Worker.create!(:name => worker_name, :protocol => 'localhost')
end

Given /^an offline worker "([^\"]*)"$/ do |worker_name|
  Worker.create!(:name => worker_name, :protocol => 'localhost', :offline => true)
end
