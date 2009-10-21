class Build < ActiveRecord::Base
  belongs_to :project
  acts_as_list :scope => :project_id
  
  after_create :enqueue
  
  def build!
    SimpleCI::DSL.evaluate(project.name, project.steps)
    update_attributes :status => 'success'
  end
  background_method :build!
  
  def enqueue
    SimpleCI::Queue.enqueue(project)
  end
end
