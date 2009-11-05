ActionMailer::Base.smtp_settings = {
  :domain => TinyCI::Config.email_domain,
  :address => TinyCI::Config.email_address,
  :port => TinyCI::Config.email_port,
  :user_name => TinyCI::Config.email_user_name,
  :password => TinyCI::Config.email_password,
  :authentication => TinyCI::Config.email_authentication
}
