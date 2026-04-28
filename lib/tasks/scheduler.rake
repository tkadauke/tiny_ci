namespace :tiny_ci do
  desc "Run the TinyCI build scheduler in the foreground (Ctrl-C to stop)"
  task scheduler: :environment do
    Rails.logger = ActiveSupport::TaggedLogging.new(Logger.new($stdout))
    puts "TinyCI scheduler starting (interval=#{TinyCI::Scheduler::DEFAULT_INTERVAL}s)"
    TinyCI::Scheduler.run
  end
end
