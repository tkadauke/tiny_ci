Given /^a slave "([^\"]*)"$/ do |slave_name|
  Slave.create!(:name => slave_name, :protocol => 'localhost')
end

Given /^an offline slave "([^\"]*)"$/ do |slave_name|
  Slave.create!(:name => slave_name, :protocol => 'localhost', :offline => true)
end
