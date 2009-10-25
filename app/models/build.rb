class Build < ActiveRecord::Base
  attr_reader :shell, :environment
  attr_accessor :source_control

  belongs_to :project
  acts_as_list :scope => :project_id
  
  named_scope :pending, :conditions => { :status => 'pending' }
  
  def build!
    update_attributes :status => 'running'
    
    system %{script/runner "Build.find(#{id}).build_without_background!"}
  end
  
  def build_without_background!
    puts "building #{name}"
    @shell = SimpleCI::Shell::Localhost.new(self)
    @environment = {}
    
    SimpleCI::DSL.evaluate(self)
    update_attributes :status => 'success'
  rescue SimpleCI::Shell::CommandExecutionFailed => e
    update_attributes :status => 'failure'
  end
  
  def buildable?
    project.buildable?
  end
  
  def name
    project.name
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
end
