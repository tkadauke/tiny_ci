class Slave < ActiveRecord::Base
  serialize :environment_variables, Hash
  
  before_save :cleanup_environment
  
  has_many :builds, :dependent => :nullify
  has_many :running_builds, :class_name => 'Build', :conditions => { :status => 'running' }
  
  named_scope :least_busy, :include => :running_builds, :group => 'builds.id', :order => 'COUNT(builds.id)', :conditions => ['offline != ?', true]
  
  validates_presence_of :name, :protocol
  validates_uniqueness_of :name
  
  overrides_field :base_path, :from => "TinyCI::Config"
  
  def self.find_for_cloning!(name)
    slave = from_param!(name)
    slave.id = nil
    slave.name = nil
    slave.instance_variable_set(:@new_record, true)
    slave
  end
  
  def current_environment
    TinyCI::Config.environment.merge(environment)
  end

  def environment
    environment_variables.inject({}) { |hash, ev| hash[ev.last['key']] = ev.last['value']; hash }
  end
  
  def busy?
    !free?
  end
  
  def free?
    running_builds.empty?
  end
  
  def self.find_free_slave_for(build)
    least_busy.find(:all).find { |slave| slave.can_build_now?(build) }
  end
  
  def all_resources
    TinyCI::Resources::Parser.parse(self.capabilities)
  end
  
  def free_resources
    res = all_resources
    running_builds.each do |build|
      res -= build.needed_resources
    end
    res
  end
  
  def can_build_now?(build)
    return false if maximum_running_builds_reached?
    return false unless can_ever_build?(build)
    
    free_resources.includes?(build.needed_resources)
  end
  
  def can_ever_build?(build)
    return false unless all_resources.includes?(build.needed_resources)
    
    req = unnumbered_resources(build.requirements)
    cap = unnumbered_resources(self.capabilities)
    
    req - cap == []
  end
  
  def to_param
    name
  end
  
  def self.from_param!(param)
    find_by_name!(param)
  end
  
protected
  def cleanup_environment
    (environment_variables || {}).reject! { |index, kv| kv['key'].blank? }
  end
  
  def unnumbered_resources(res)
    (res || "").split(',').map(&:strip).select { |x| x.to_i == 0 }.map(&:downcase)
  end
  
  def maximum_running_builds_reached?
    self.max_builds > 0 && self.running_builds.count >= self.max_builds
  end
end
