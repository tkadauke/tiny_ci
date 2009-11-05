class Slave < ActiveRecord::Base
  serialize :environment_variables, Hash
  
  before_save :cleanup_environment
  
  has_many :builds
  has_many :running_builds, :class_name => 'Build', :conditions => { :status => 'running' }
  
  named_scope :least_busy, :include => :running_builds, :group => 'builds.id', :order => 'COUNT(builds.id)', :conditions => 'not offline'
  
  validates_presence_of :name, :protocol
  validates_uniqueness_of :name
  
  overrides_field :base_path, :from => "TinyCI::Config"
  
  def self.find_for_cloning!(id)
    slave = find(id)
    slave.id = nil
    slave.name = nil
    slave.instance_variable_set(:@new_record, true)
    slave
  end
  
  def current_environment
    TinyCI::Config.environment.merge(environment)
  end

  def busy?
    !free?
  end
  
  def free?
    running_builds.empty?
  end
  
  def self.find_free_slave_for(build)
    least_busy.find(:all).find { |slave| slave.can_build?(build) }
  end
  
  def current_builds
    Build.find(:all, :conditions => { :status => 'running', :slave_id => self.id })
  end
  
  def environment
    environment_variables.inject({}) { |hash, ev| hash[ev.last['key']] = ev.last['value']; hash }
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
  
  def can_build?(build)
    req = unnumbered_resources(build.requirements)
    cap = unnumbered_resources(self.capabilities)
    
    free_resources.includes?(build.needed_resources) && req - cap == []
  end
  
protected
  def cleanup_environment
    environment_variables.reject! { |index, kv| kv['key'].blank? }
  end
  
  def unnumbered_resources(res)
    (res || "").split(',').map(&:strip).select { |x| x.to_i == 0 }.map(&:downcase)
  end
end
