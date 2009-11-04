class Project < ActiveRecord::Base
  has_many :builds
  has_many :running_builds, :class_name => 'Build', :conditions => { :status => 'running' }
  has_many :pending_builds, :class_name => 'Build', :conditions => { :status => 'pending' }
  
  belongs_to :previous, :class_name => 'Project', :foreign_key => 'previous_project_id'
  has_one :next, :class_name => 'Project', :foreign_key => 'previous_project_id'
  
  validates_presence_of :name
  validates_uniqueness_of :name
  
  acts_as_tree
  
  named_scope :root_set, :conditions => 'parent_id is null'
  
  def self.find_for_cloning!(name)
    project = find_by_name!(name)
    project.id = nil
    project.name = nil
    project.instance_variable_set(:@new_record, true)
    project
  end
  
  def needed_resources
    TinyCI::Resources::Parser.parse(self.requirements)
  end
  
  def has_children?
    !children.empty?
  end
  
  def build!(parameters = {})
    builds.create(:status => 'pending', :parameters => parameters)
  end
  
  def build_children!(build)
    children.each do |child|
      child.build_with_parent_build!(build)
    end
  end
  
  def build_with_parent_build!(build)
    builds.create(:status => 'pending', :parent => build, :parameters => build.environment)
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
