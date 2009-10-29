class Build < ActiveRecord::Base
  attr_reader :shell, :environment
  attr_accessor :source_control

  delegate :name, :to => :project

  belongs_to :project
  belongs_to :slave
  acts_as_list :scope => :project_id
  
  named_scope :pending, :conditions => { :status => 'pending' }
  
  def assign_to!(slave)
    update_attributes(:slave => slave)
  end
  
  def buildable?
    project.buildable? && pending?
  end
  
  def running?
    status == 'running'
  end
  
  def pending?
    status == 'pending'
  end
  
  def build!
    @shell = SimpleCI::Shell.open(self)
    @environment = {}
    
    create_base_directory
    SimpleCI::DSL.evaluate(self)
    update_attributes :status => 'success'
  rescue SignalException => e
    update_attributes :status => 'stopped'
  rescue SimpleCI::Shell::CommandExecutionFailed => e
    update_attributes :status => 'failure'
  rescue Exception => e
    add_to_output(Time.now, 'runner', [e.message] + e.backtrace)
    update_attributes :status => 'error'
  end
  
  def stop!
    SimpleCI::Scheduler::Client.stop(self)
  end
  
  def workspace_path
    "#{SimpleCI::Config.base_path}/#{name}"
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
    Juggernaut.send_to_channel("Report.update()", "build_#{name}_#{position}")
  end
  
  def to_param
    position.to_s
  end
  
  def build_output
    @build_output ||= []
  end

private
  def create_base_directory
    @shell.mkdir(SimpleCI::Config.base_path)
  end
end
