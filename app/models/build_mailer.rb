class BuildMailer < ActionMailer::Base
  def success(build)
    subject "Build %s succeeded" % build.name
    set_header(build)
  end
  
  def failure(build)
    subject "Build %s failed" % build.name
    set_header(build)
  end
  
private
  def set_header(build)
    recipients TinyCI::Config.recipient_address
    from TinyCI::Config.sender_address
    body :build => build
  end
end
