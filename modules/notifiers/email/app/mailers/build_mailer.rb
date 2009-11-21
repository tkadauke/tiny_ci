class BuildMailer < ActionMailer::Base
  def success(build)
    setup
    subject "Build %s succeeded" % build.name
    set_header(build)
  end
  
  def failure(build)
    setup
    subject "Build %s failed" % build.name
    set_header(build)
  end
  
private
  def setup
    ActionMailer::Base.smtp_settings = {
      :domain => TinyCI::Config.email_domain,
      :address => TinyCI::Config.email_address,
      :port => TinyCI::Config.email_port,
      :user_name => TinyCI::Config.email_user_name,
      :password => TinyCI::Config.email_password,
      :authentication => TinyCI::Config.email_authentication
    }
  end
  
  def set_header(build)
    recipients TinyCI::Config.recipient_address
    from TinyCI::Config.sender_address
    body :build => build
  end
end
