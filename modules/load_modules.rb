Dir.glob(File.dirname(__FILE__) + '/*/*/init.rb') do |mod|
  require mod
end
