require File.dirname(__FILE__) + '/../test_helper'

Dir.glob("#{RAILS_ROOT}/lib/**/*.rb").each do |file|
  require file
end

module Mysql
  class Error < StandardError
  end
end

require 'mocha'
