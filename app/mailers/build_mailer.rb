class BuildMailer < ApplicationMailer
  def success(recipient, build)
    @build = build
    mail to: recipient.email,
         subject: I18n.t("build_mailer.subject.success", project: build.project.name, plan: build.name)
  end

  def failure(recipient, build)
    @build = build
    mail to: recipient.email,
         subject: I18n.t("build_mailer.subject.failure", project: build.project.name, plan: build.name)
  end
end
