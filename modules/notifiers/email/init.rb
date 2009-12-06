$:.unshift "#{File.dirname(__FILE__)}/app/mailers"

require File.expand_path(File.dirname(__FILE__) + '/lib/tiny_ci/notifier/email_notifier')
require 'build_mailer'

BuildMailer.template_root = File.expand_path(File.dirname(__FILE__) + '/app/views')
