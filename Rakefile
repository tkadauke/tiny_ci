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
  
  dirs = ["app", "config", "db", "lib", "public", "script", "vendor"].map { |dir| "#{dir}/**/*" }
  files = dirs + ["Rakefile"]
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

namespace :test do
  task :coverage do
    output_dir = "test/coverage"
    rm_f "#{output_dir}/*"
    rm_f "#{output_dir}/coverage.data"
    mkdir_p output_dir
    rcov = "rcov -o #{output_dir} --rails --aggregate #{output_dir}/coverage.data --text-summary --exclude=\"gems/*,rubygems/*,rcov*\" -Ilib"

    test_files = Dir.glob('test/unit/**/*_test.rb')
    sh %{#{rcov} #{test_files.join(' ')}} unless test_files.empty?

    test_files = Dir.glob('test/functional/**/*_test.rb')
    sh %{#{rcov} --html #{test_files.join(' ')}} unless test_files.empty?
  end
end
