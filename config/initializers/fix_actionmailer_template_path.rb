class ActionMailer::Base
  def template_path
    "#{RAILS_ROOT}/#{template_root}/#{mailer_name}"
  end
end
