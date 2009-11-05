ActionMailer::Base.smtp_settings = {
  :domain => SimpleCI::Config.email_domain,
  :address => SimpleCI::Config.email_address,
  :port => SimpleCI::Config.email_port,
  :user_name => SimpleCI::Config.email_user_name,
  :password => SimpleCI::Config.email_password,
  :authentication => SimpleCI::Config.email_authentication
}
