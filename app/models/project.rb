class Project < ActiveRecord::Base
  has_many :builds
  has_many :running_builds, :class_name => 'Build', :conditions => { :status => 'running' }
  has_many :pending_builds, :class_name => 'Build', :conditions => { :status => 'pending' }
  
  def build!
    Build.create(:project_id => self.id, :status => 'pending')
  end
  
  def buildable?
    running_builds.empty?
  end
end
