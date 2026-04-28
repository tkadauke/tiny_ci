module TinyCI
  module Setup
    # First-run wizard backing model. Used only when ENV["SETUP"] == "true";
    # the admin/setup controller renders a form, this validates the DB
    # connection, writes config templates, and runs `bin/rails db:prepare`.
    class InitialConfig
      attr_accessor :db_user, :db_password, :db_host, :db_name
      attr_accessor :language
      attr_accessor :error_message

      def initialize(attributes = {})
        if attributes.empty?
          self.db_user = "root"
          self.db_host = "localhost"
          self.db_name = "tiny_ci_production"
        else
          attributes.each { |key, value| send("#{key}=", value) }
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
        attempt_connection(database: db_name) || attempt_connection(database: nil)
      end

      def attempt_connection(database:)
        ActiveRecord::Base.establish_connection(
          adapter: "trilogy",
          username: db_user,
          password: db_password,
          host: db_host,
          database: database
        )
        ActiveRecord::Base.connection.active?
      rescue StandardError => e
        self.error_message = e.message
        false
      end

      def write_config
        Dir.glob(Rails.root.join("config/templates/*.yml.erb").to_s).each do |file_path|
          file_name = File.basename(file_path).gsub(/\.erb$/, "")
          File.open(Rails.root.join("config", file_name).to_s, "w") do |file|
            config = self # rubocop:disable Lint/UselessAssignment - referenced from ERB binding
            file.print ERB.new(File.read(file_path)).result(binding)
          end
        end
      end

      def setup_database
        system "bin/rails db:prepare SETUP=false"
      end
    end
  end
end
