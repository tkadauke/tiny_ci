class Project < ActiveRecord::Base
  has_many :builds
  has_many :running_builds, :class_name => 'Build', :conditions => { :status => 'running' }
  has_many :pending_builds, :class_name => 'Build', :conditions => { :status => 'pending' }
  
  acts_as_tree
  
  named_scope :root_set, :conditions => 'parent_id is null'
  
  def has_children?
    !children.empty?
  end
  
  def build!
    builds.create(:status => 'pending')
  end
  
  def build_children!(build)
    children.each do |child|
      child.build_with_parent_build!(build)
    end
  end
  
  def build_with_parent_build!(build)
    builds.create(:status => 'pending', :parent => build)
  end
  
  def buildable?
    running_builds.empty?
  end
  
  def to_param
    name
  end
  
  def standalone?
    parent_id.blank?
  end
end
