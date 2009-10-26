class Project < ActiveRecord::Base
  has_many :builds
  has_many :running_builds, :class_name => 'Build', :conditions => { :status => 'running' }
  has_many :pending_builds, :class_name => 'Build', :conditions => { :status => 'pending' }
  
  def build!
    builds.create(:status => 'pending')
  end
  
  def buildable?
    running_builds.empty?
  end
  
  def to_param
    name
  end
end
