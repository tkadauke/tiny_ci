class Build < ActiveRecord::Base
  belongs_to :project
  acts_as_list :scope => :project_id
  
  named_scope :pending, :conditions => { :status => 'pending' }
  
  def build!
    update_attributes :status => 'running'
    
    capture_output %{script/runner "Build.find(#{id}).build_without_background!"}
  end
  
  def build_without_background!
    SimpleCI::DSL.evaluate(project.name, project.steps)
    update_attributes :status => 'success'
  end
  
  def buildable?
    project.buildable?
  end
  
private
  def capture_output(command)
    IO.popen("#{command} 2>&1") do |stdout|
      output = ""
      while !stdout.eof?
        if line = stdout.gets
          puts output
          output << line
          reload.update_attributes(:output => output)
        end
      end
    end
  end
end
