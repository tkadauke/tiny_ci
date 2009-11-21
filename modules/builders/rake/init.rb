$:.unshift "#{File.dirname(__FILE__)}/lib"

require 'tiny_ci/dsl'
require 'tiny_ci/steps/builder/rake'
require 'tiny_ci/output_parser/rake_parser'
require 'tiny_ci/output_parser/rake_test_parser'
require 'tiny_ci/output_parser/rake_task_parser'
