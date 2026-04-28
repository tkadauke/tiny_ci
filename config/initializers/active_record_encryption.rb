# Active Record Encryption keys.
#
# Keys are sourced (in order) from Rails encrypted credentials and then from
# environment variables. The ENV fallback keeps development/test usable
# without requiring the credentials store to be set up. In production, prefer
# placing the keys in `config/credentials.yml.enc` under the
# `active_record_encryption` namespace, e.g.:
#
#   active_record_encryption:
#     primary_key: ...
#     deterministic_key: ...
#     key_derivation_salt: ...
#
# Generate fresh values with: bin/rails db:encryption:init

primary_key =
  Rails.application.credentials.dig(:active_record_encryption, :primary_key) ||
  ENV["ACTIVE_RECORD_ENCRYPTION_PRIMARY_KEY"]

deterministic_key =
  Rails.application.credentials.dig(:active_record_encryption, :deterministic_key) ||
  ENV["ACTIVE_RECORD_ENCRYPTION_DETERMINISTIC_KEY"]

key_derivation_salt =
  Rails.application.credentials.dig(:active_record_encryption, :key_derivation_salt) ||
  ENV["ACTIVE_RECORD_ENCRYPTION_KEY_DERIVATION_SALT"]

if primary_key && deterministic_key && key_derivation_salt
  Rails.application.config.active_record.encryption.primary_key = primary_key
  Rails.application.config.active_record.encryption.deterministic_key = deterministic_key
  Rails.application.config.active_record.encryption.key_derivation_salt = key_derivation_salt
elsif Rails.env.production?
  raise "Active Record encryption keys are not configured. Set them in credentials " \
        "or via ACTIVE_RECORD_ENCRYPTION_PRIMARY_KEY, " \
        "ACTIVE_RECORD_ENCRYPTION_DETERMINISTIC_KEY, and " \
        "ACTIVE_RECORD_ENCRYPTION_KEY_DERIVATION_SALT environment variables."
end
