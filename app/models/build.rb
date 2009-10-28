class Build < ActiveRecord::Base
  attr_reader :shell, :environment
  attr_accessor :source_control

  delegate :name, :buildable?, :to => :project

  belongs_to :project
  acts_as_list :scope => :project_id
  
  named_scope :pending, :conditions => { :status => 'pending' }
  
  def build!
    @shell = SimpleCI::Shell::Localhost.new(self)
    @environment = {}
    
    create_project_directory
    SimpleCI::DSL.evaluate(self)
    update_attributes :status => 'success'
  rescue Exception => e
    add_lines_to_output(Time.now, 'runner', [e.message] + e.backtrace)
    update_attributes :status => 'failure'
  end
  
  def workspace_path
    "#{ENV['HOME']}/simple_ci/#{name}"
  end
  
  def add_to_output(time, command, lines)
    add_lines_to_output(time, command, lines)
    flush_output! if updated_at < 1.second.ago
  end
  
  def add_lines_to_output(time, command, lines)
    @output ||= []
    [lines].flatten.each do |line|
      @output << [time.to_f, command, line.strip].to_csv
    end
  end
  
  def flush_output!
    reload.update_attributes(:output => @output.join)
    Juggernaut.send_to_channel("Report.update()", "build_#{name}_#{position}")
  end
  
  def to_param
    position.to_s
  end

private
  def create_project_directory
    @shell.mkdir(workspace_path)
  end
end
