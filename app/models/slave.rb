class Slave < ActiveRecord::Base
  has_many :builds
  has_many :running_builds, :class_name => 'Build', :conditions => { :status => 'running' }
  
  def busy?
    !free?
  end
  
  def free?
    running_builds.empty?
  end
  
  def self.find_free_slave
    all.find { |slave| slave.free? }
  end
  
  def current_builds
    Build.find(:all, :conditions => { :status => 'running', :slave_id => self.id })
  end
end
