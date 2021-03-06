# Add your own tasks in files placed in lib/tasks ending in .rake,
# for example lib/tasks/capistrano.rake, and they will automatically be available to Rake.

require(File.join(File.dirname(__FILE__), 'config', 'boot'))

require 'rake'
require 'rake/testtask'
require 'rdoc/task'

require 'tasks/rails'

desc "Start the TinyCI server"
task :start do
  sh "script/daemon start"
end

desc "Stop the TinyCI server"
task :stop do
  sh "script/daemon stop"
end

desc "Restart the TinyCI server"
task :restart => [:stop, :start]

namespace :test do
  desc 'Measure test coverage'
  task :coverage do
    output_dir = "test/coverage"
    rm_f "#{output_dir}/*"
    rm_f "#{output_dir}/coverage.data"
    mkdir_p output_dir
    rcov = "rcov -o #{output_dir} --rails --aggregate #{output_dir}/coverage.data --text-summary --exclude=\"gems/*,rubygems/*,rcov*,modules/*\" -Ilib"

    test_files = Dir.glob('test/unit/**/*_test.rb')
    sh %{#{rcov} #{test_files.join(' ')}} unless test_files.empty?

    test_files = Dir.glob('test/functional/**/*_test.rb')
    sh %{#{rcov} --html #{test_files.join(' ')}} unless test_files.empty?
  end
  
  desc 'Test all modules'
  task :modules do
    Dir.glob('modules/*/*/init.rb').each do |init_file|
      Dir.chdir File.dirname(init_file) do
        sh 'rake test'
      end
    end
  end
end
