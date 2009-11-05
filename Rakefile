# Add your own tasks in files placed in lib/tasks ending in .rake,
# for example lib/tasks/capistrano.rake, and they will automatically be available to Rake.

require(File.join(File.dirname(__FILE__), 'config', 'boot'))

require 'rake'
require 'rake/testtask'
require 'rake/rdoctask'

require 'tasks/rails'

desc "Start the TinyCI server"
task :start => ['db:migrate'] do
  sh "script/daemon start"
end

desc "Stop the TinyCI server"
task :stop do
  sh "script/daemon stop"
end

desc "Restart the TinyCI server"
task :restart => [:stop, :start]

desc "Package TinyCI for distribution"
task :dist do
  sh "rake rails:freeze:gems"
  sh "rake gems:unpack:dependencies"
  
  files = ["app", "config", "db", "lib", "public", "script", "vendor"].map { |dir| "#{dir}/**/*" }
  FileUtils.rm_rf "dist"
  FileUtils.mkdir_p "dist"
  sh "tar -cf dist/tiny_ci.tar #{Dir.glob(files).join(' ')}"
  sh "gzip dist/tiny_ci.tar"
end

desc "Clean up distribution files"
task :distclean => "rails:unfreeze" do
  sh "rm -rf vendor/gems"
  sh "rm -rf dist"
end