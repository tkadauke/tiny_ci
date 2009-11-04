# Be sure to restart your server when you modify this file.

# Your secret key for verifying cookie session data integrity.
# If you change this key, all old sessions will become invalid!
# Make sure the secret is at least 30 characters and all random, 
# no regular words or you'll be exposed to dictionary attacks.
ActionController::Base.session = {
  :key         => '_tiny_ci_session',
  :secret      => '03b421016644c96a58e592f7a99058acc7658eb0d15c797e510d18042b3c70c1a27e008ed3fcd22c9f5b3af791662a5a741e66c61fa3659e620150348f3efc98'
}

# Use the database for sessions instead of the cookie-based default,
# which shouldn't be used to store highly confidential information
# (create the session table with "rake db:sessions:create")
# ActionController::Base.session_store = :active_record_store
