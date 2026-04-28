class ApplicationMailer < ActionMailer::Base
  default from: -> { TinyCI::Config.email_sender_address }
end
