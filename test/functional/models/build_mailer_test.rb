require File.dirname(__FILE__) + '/../../test_helper'

class BuildMailerTest < ActionMailer::TestCase
  def setup
    @project = Project.create(:name => 'some_project')
    @plan = @project.plans.create(:name => 'some_plan')
  end
  
  test "should deliver success mails" do
    build = @plan.builds.create(:status => 'success')

    BuildMailer.deliver_success(build)
    assert !ActionMailer::Base.deliveries.empty?
    sent = ActionMailer::Base.deliveries.first
    assert_equal [TinyCI::Config.recipient_address], sent.to
    assert_equal "Build some_plan succeeded", sent.subject
    assert sent.body =~ /succeeded/
    assert sent.body =~ /http/
  end
  
  test "should deliver failure mails" do
    build = @plan.builds.create(:status => 'failure')

    BuildMailer.deliver_failure(build)
    assert !ActionMailer::Base.deliveries.empty?
    sent = ActionMailer::Base.deliveries.first
    assert_equal [TinyCI::Config.recipient_address], sent.to
    assert_equal "Build some_plan failed", sent.subject
    assert sent.body =~ /failed/
    assert sent.body =~ /http/
  end
  
  test "should have failure status in mails" do
    build = @plan.builds.create(:status => 'stopped')

    BuildMailer.deliver_failure(build)
    assert !ActionMailer::Base.deliveries.empty?
    sent = ActionMailer::Base.deliveries.first
    assert sent.body =~ /stopped/
    assert sent.body =~ /http/
  end
end
