# Be sure to restart your server when you modify this file

# Specifies gem version of Rails to use when vendor/rails is not present
RAILS_GEM_VERSION = '2.3.3' unless defined? RAILS_GEM_VERSION

# Bootstrap the Rails environment, frameworks, and default configuration
require File.join(File.dirname(__FILE__), 'boot')
require File.join(File.dirname(__FILE__), 'version')

if ENV['SETUP'] == 'true'
  class Rails::Initializer
    # do not run initializers if we're in SETUP mode, except for the ones explicitly required
    def load_application_initializers
      require "#{RAILS_ROOT}/config/initializers/session_store"
    end
    
    # do not eager load classes, because the models depend on active record, which won't be loaded
    def load_application_classes
    end
  end
  
  Rails::Initializer.run do |config|
    config.frameworks -= [ :active_record, :active_resource ]
    config.plugins = []
  end
else
  Rails::Initializer.run do |config|
    # Settings in config/environments/* take precedence over those specified here.
    # Application configuration should go into files in config/initializers
    # -- all .rb files in that directory are automatically loaded.

    # Add additional load paths for your own custom dirs
    # config.load_paths += %W( #{RAILS_ROOT}/extras )

    # Specify gems that this application depends on and have them installed with rake gems:install
    config.gem 'fastercsv'
    config.gem 'juggernaut', :version => '0.5.8'
    config.gem 'net-ssh', :lib => "net/ssh"
    config.gem 'RedCloth'
    config.gem 'authlogic', :version => '2.1.3'
  
    # config.gem "bj"
    # config.gem "hpricot", :version => '0.6', :source => "http://code.whytheluckystiff.net"
    # config.gem "sqlite3-ruby", :lib => "sqlite3"
    # config.gem "aws-s3", :lib => "aws/s3"

    # Only load the plugins named here, in the order given (default is alphabetical).
    # :all can be used as a placeholder for all plugins not explicitly named
    # config.plugins = [ :exception_notification, :ssl_requirement, :all ]

    # Skip frameworks you're not going to use. To use Rails without a database,
    # you must remove the Active Record framework.
    config.frameworks -= [ :active_resource ]

    # Activate observers that should always be running
    config.active_record.observers = :build_observer

    # Set Time.zone default to the specified zone and make Active Record auto-convert to this zone.
    # Run "rake -D time" for a list of tasks for finding time zone names.
    config.time_zone = 'UTC'

    # The default locale is :en and all translations from config/locales/*.rb,yml are auto loaded.
    # config.i18n.load_path += Dir[Rails.root.join('my', 'locales', '*.{rb,yml}')]
    # config.i18n.default_locale = :de
  end
  
  require File.dirname(__FILE__) + '/../modules/load_modules'
end
