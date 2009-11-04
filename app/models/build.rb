class Build < ActiveRecord::Base
  attr_reader :shell
  attr_accessor :source_control
  
  serialize :parameters, Hash

  delegate :name, :repository_url, :requirements, :needed_resources, :to => :project

  belongs_to :project
  belongs_to :slave
  acts_as_list :scope => :project_id
  acts_as_tree
  
  named_scope :pending, :conditions => { :status => 'pending' }
  named_scope :finished, :conditions => ['status != ? and status != ?', 'pending', 'running']
  
  overrides_field :revision, :from => :parent, :if => lambda { |build| build.repository_url == build.parent.repository_url }
  
  attr_accessor :previous_changes
  before_save { |build| build.previous_changes = build.changes }
  
  after_update :update_stats_if_neccessary
  
  def duration
    finished_at && started_at ? (finished_at - started_at) : nil
  end
  
  def environment
    @environment ||= (self.parameters || {})
  end
  
  def current_environment
    slave.current_environment.merge(environment)
  end
  
  def assign_to!(slave)
    update_attributes(:slave => slave)
  end
  
  def buildable?
    project.buildable? && pending?
  end
  
  def finished?
    good? || bad?
  end
  
  [:running, :pending, :waiting, :success, :error, :failure, :canceled, :stopped].each do |status_name|
    define_method "#{status_name}?" do
      self.status == status_name.to_s
    end
  end
  
  def good?
    success?
  end
  
  def bad?
    error? || failure? || canceled? || stopped?
  end
  
  def has_children?
    !children.empty?
  end
  
  def build!
    @shell = TinyCI::Shell.open(self)
    
    create_base_directory
    TinyCI::DSL.evaluate(self)
    if project.has_children?
      update_attributes :status => 'waiting'
    else
      update_attributes :status => 'success', :finished_at => Time.now
    end
  rescue SignalException => e
    update_attributes :status => 'stopped', :finished_at => Time.now
  rescue TinyCI::Shell::CommandExecutionFailed => e
    update_attributes :status => 'failure', :finished_at => Time.now
  rescue Exception => e
    add_to_output(Time.now, 'runner', [e.message] + e.backtrace)
    update_attributes :status => 'error', :finished_at => Time.now
  ensure
    finished
  end
  
  def stop!
    TinyCI::Scheduler::Client.stop(self)
  end
  
  def finished
    parent.child_finished(self) if parent
    project.next.build_with_parent_build!(self) if success? && project.next
  end
  
  def child_finished(child)
    if waiting? && children.all?(&:finished?)
      success = children.all?(&:success?)
      update_attributes :status => (success ? 'success' : 'failure'), :finished_at => Time.now
      project.next.build_with_parent_build!(self) if success? && project.next
    end
  end
  
  def workspace_path
    "#{slave.base_path}/#{name}"
  end
  
  def add_to_output(time, command, lines)
    add_lines_to_output(time, command, lines)
    flush_output! if updated_at < 1.second.ago
  end
  
  def add_lines_to_output(time, command, lines)
    [lines].flatten.each do |line|
      build_output << [time.to_f, command, line.strip].to_csv
    end
  end
  
  def flush_output!
    reload.update_attributes(:output => build_output.join)
  end
  
  def to_param
    position.to_s
  end
  
  def build_output
    @build_output ||= []
  end

  def update_stats_if_neccessary
    if previous_changes.has_key?('status') && finished?
      project.update_build_stats!
    end
  end

private
  def create_base_directory
    @shell.mkdir(slave.base_path)
  end
end
