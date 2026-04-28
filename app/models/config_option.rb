class ConfigOption < ApplicationRecord
  validates :key, presence: true
end
