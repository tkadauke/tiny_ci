class BuildMailer < ActionMailer::Base
  def success(recipient, build)
    setup
    subject I18n.t('build_mailer.subject.success', :project => build.project.name, :plan => build.name)
    set_header(recipient, build)
  end
  
  def failure(recipient, build)
    setup
    subject I18n.t('build_mailer.subject.failure', :project => build.project.name, :plan => build.name)
    set_header(recipient, build)
  end
  
private
  def setup
    ActionMailer::Base.smtp_settings = {
      :domain => TinyCI::Config.email_domain,
      :address => TinyCI::Config.email_address,
      :port => TinyCI::Config.email_port,
      :user_name => TinyCI::Config.email_user_name,
      :password => TinyCI::Config.email_password,
      :authentication => TinyCI::Config.email_authentication.to_sym
    }
  end
  
  def set_header(recipient, build)
    recipients recipient.email
    from TinyCI::Config.email_sender_address
    body :build => build
  end
end
