Given /^a user "([^\"]*)"$/ do |login|
  create_user(login)
end

Given /^a user "([^\"]*)" with password "([^\"]*)"$/ do |login, password|
  create_user(login, password)
end

Given /^I am a logged in user "([^\"]*)"$/ do |login|
  user = create_user(login)
  login(user)
end

Given /^I am a logged in admin "([^\"]*)"$/ do |login|
  user = create_user(login)
  user.role = 'admin'
  user.save
  login(user)
end

Given /^I am the initial admin$/ do
end

Given /^I am a guest$/ do
end

def create_user(login, password = 'password')
  User.create!(:login => login, :password => password, :password_confirmation => password, :email => "#{login}@example.com")
end

def login(user)
  visit login_path
  fill_in :login, :with => user.login
  fill_in :password, :with => 'password'
  click_button "Login"
end
