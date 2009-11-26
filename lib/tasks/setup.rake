desc "Setup fresh installation"
task :setup do
  if File.directory?('vendor/gems')
    Rake::Task["gems:build"].invoke
  else
    begin
      Rake::Task["environment"].invoke
    rescue
    end
    
    Rake::Task["gems:install"].invoke
  end
end
