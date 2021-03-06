desc "Package TinyCI for distribution"
task :dist do
  require File.dirname(__FILE__) + '/../../config/version'
  
  sh "rake rails:freeze:gems"
  sh "rake gems:unpack:dependencies"
  
  FileUtils.rm_rf "dist"
  FileUtils.mkdir_p "dist"
  
  files = ["app", "config/*.rb", "config/*/*", "config/background.yml", "config/options.yml", "config/user_options.yml", "doc", "db/*.rb", "db/*/*", "lib", "modules", "public", "script", "vendor", "Rakefile"]
  patterns = files.collect { |f| File.directory?(f) ? "#{f}/**/*" : f }
  archive_name = "tiny_ci-#{TINY_CI_VERSION}"
  
  dest_path = "dist/#{archive_name}"
  
  Dir.glob(patterns, File::FNM_DOTMATCH).each do |file|
    next if file =~ /\/\.\//
    dir = File.dirname(file)
    dest_dir = "#{dest_path}/#{dir}"
    FileUtils.mkdir_p(dest_dir)
    FileUtils.cp file, dest_dir unless File.directory?(file)
  end
  
  Dir.chdir('dist') do
    sh "tar -cf #{archive_name}.tar #{archive_name}"
    sh "gzip #{archive_name}.tar"
    FileUtils.rm_rf archive_name
  end
end

desc "Clean up distribution files"
task :distclean => "rails:unfreeze" do
  sh "rm -rf vendor/gems"
  sh "rm -rf dist"
end
