class ConfigOption < ActiveRecord::Base
  validates_presence_of :key
end
