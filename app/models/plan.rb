class Plan < ActiveRecord::Base
  belongs_to :project
  has_many :builds, :dependent => :destroy
  has_many :running_builds, :class_name => 'Build', :conditions => { :status => 'running' }
  has_many :pending_builds, :class_name => 'Build', :conditions => { :status => 'pending' }
  
  has_many :weather_relevant_builds, :class_name => 'Build', :order => 'created_at DESC', :conditions => 'finished_at is not null', :limit => 5
  has_one :last_finished_build, :class_name => 'Build', :order => 'created_at DESC', :conditions => 'finished_at is not null'
  has_one :last_successful_build, :class_name => 'Build', :order => 'created_at DESC', :conditions => ['status = ? and finished_at is not null', 'success']
  has_one :last_failed_build, :class_name => 'Build', :order => 'created_at DESC', :conditions => ['status in (?) and finished_at is not null', ['error', 'failure']]
  
  belongs_to :previous, :class_name => 'Plan', :foreign_key => 'previous_plan_id'
  has_one :next, :class_name => 'Plan', :foreign_key => 'previous_plan_id'
  
  validates_presence_of :name
  validates_uniqueness_of :name, :scope => :project_id
  
  validates_presence_of :project_id
  
  acts_as_tree
  
  before_update :break_chain_if_child
  
  def self.find_for_cloning!(name)
    plan = find_by_name!(name)
    plan.id = nil
    plan.name = nil
    plan.instance_variable_set(:@new_record, true)
    plan
  end
  
  def self.new_with_parent(name)
    new(:parent => find_by_name!(name))
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
  
  def build_next!(parent)
    self.next.build_with_parent_build!(parent) if self.next
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
  
  def update_build_stats!
    fill_build_count = 5 - weather_relevant_builds.size
    
    self.weather = weather_relevant_builds.collect { |build| build.good? ? 1 : 0 }.sum + fill_build_count
    self.status = last_finished_build.status rescue nil
    self.last_build_time = last_finished_build.duration rescue nil
    self.last_succeeded_at = last_successful_build.finished_at rescue nil
    self.last_failed_at = last_failed_build.finished_at rescue nil
    save
  end
  
  def needed_resources
    TinyCI::Resources::Parser.parse(self.requirements)
  end
  
protected
  def break_chain_if_child
    if self.parent
      self.previous = nil
      self.next = nil
    end
    return true
  end
end
