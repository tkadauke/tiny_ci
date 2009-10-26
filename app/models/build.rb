class Build < ActiveRecord::Base
  attr_reader :shell, :environment
  attr_accessor :source_control

  delegate :name, :buildable?, :to => :project

  belongs_to :project
  acts_as_list :scope => :project_id
  
  named_scope :pending, :conditions => { :status => 'pending' }
  
  def build!
    update_attributes :status => 'running'
    
    system %{script/runner "Build.find(#{id}).build_without_background!"}
  end
  
  def build_without_background!
    @shell = SimpleCI::Shell::Localhost.new(self)
    @environment = {}
    
    create_project_directory
    SimpleCI::DSL.evaluate(self)
    update_attributes :status => 'success'
  rescue SimpleCI::Shell::CommandExecutionFailed => e
    update_attributes :status => 'failure'
  end
  
  def workspace_path
    "#{ENV['HOME']}/simple_ci/#{name}"
  end
  
  def add_to_output(time, command, line)
    @output ||= []
    @output << [time.to_f, command, line.strip].to_csv
    flush_output! if updated_at < 1.second.ago
  end
  
  def flush_output!
    reload.update_attributes(:output => @output.join)
  end
  
  def to_param
    position.to_s
  end

private
  def create_project_directory
    @shell.mkdir(workspace_path)
  end
end
