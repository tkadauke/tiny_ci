class Slave < ActiveRecord::Base
  serialize :environment_variables, Hash
  
  before_save :cleanup_environment
  
  has_many :builds
  has_many :running_builds, :class_name => 'Build', :conditions => { :status => 'running' }
  
  overrides_field :base_path, :from => "SimpleCI::Config"
  
  def self.find_for_cloning!(id)
    slave = find(id)
    slave.id = nil
    slave.name = nil
    slave.instance_variable_set(:@new_record, true)
    slave
  end
  
  def current_environment
    SimpleCI::Config.environment.merge(environment)
  end

  def busy?
    !free?
  end
  
  def free?
    running_builds.empty?
  end
  
  def self.find_free_slave
    all.find { |slave| !slave.offline? && slave.free? }
  end
  
  def current_builds
    Build.find(:all, :conditions => { :status => 'running', :slave_id => self.id })
  end
  
  def environment
    environment_variables.inject({}) { |hash, ev| hash[ev.last['key']] = ev.last['value']; hash }
  end
  
protected
  def cleanup_environment
    environment_variables.reject! { |index, kv| kv['key'].blank? }
  end
end
