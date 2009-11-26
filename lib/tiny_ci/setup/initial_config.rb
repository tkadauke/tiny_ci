module TinyCI
  module Setup
    class InitialConfig
      attr_accessor :db_user, :db_password, :db_host, :db_name
      attr_accessor :error_message
  
      def initialize(attributes = {})
        if attributes == {}
          self.db_user = 'root'
          self.db_host = 'localhost'
          self.db_name = 'tiny_ci_production'
        else
          attributes.each do |key, value|
            send("#{key}=", value)
          end
        end
      end
  
      def save
        return false unless try_connection
        write_config
        setup_database
        true
      end

    private
      def try_connection
        require 'activerecord'

        ActiveRecord::Base.establish_connection(
          :adapter => 'mysql',
          :username => db_user,
          :password => db_password,
          :host => db_host,
          :database => db_name
        )
        ActiveRecord::Base.connection.active?
      rescue Mysql::Error
        begin
          ActiveRecord::Base.establish_connection(
            :adapter => 'mysql',
            :username => db_user,
            :password => db_password,
            :host => db_host,
            :database => nil
          )
          ActiveRecord::Base.connection.active?
        rescue Mysql::Error => e
          self.error_message = e.message
          false
        end
      end
  
      def write_config
        Dir.glob("#{RAILS_ROOT}/config/templates/*.yml.erb").each do |file_path|
          file_name = File.basename(file_path).gsub(/\.erb$/, '')
          File.open("#{RAILS_ROOT}/config/#{file_name}", 'w') do |file|
            config = self
            file.print ERB.new(File.read(file_path)).result(binding)
          end
        end
      end
  
      def setup_database
        system "rake db:create:all db:migrate SETUP=false"
      end
    end
  end
end
