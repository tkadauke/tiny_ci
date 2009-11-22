Given /^a user "([^\"]*)"$/ do |login|
  User.create!(:login => login, :password => 'password', :password_confirmation => 'password', :email => "#{login}@example.com")
end

Given /^a user "([^\"]*)" with password "([^\"]*)"$/ do |login, password|
  User.create!(:login => login, :password => password, :password_confirmation => password, :email => "#{login}@example.com")
end

Given /^I am a logged in user "([^\"]*)"$/ do |login|
  user = User.create!(:login => login, :password => 'password', :password_confirmation => 'password', :email => "#{login}@example.com")
  visit login_path
  fill_in :login, :with => login
  fill_in :password, :with => 'password'
  click_button "Login"
end
