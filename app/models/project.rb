class Project < ActiveRecord::Base
  has_many :plans
  has_many :root_plans, :class_name => 'Plan', :conditions => 'parent_id is null'
  
  validates_presence_of :name
  validates_uniqueness_of :name
  
  def to_param
    name
  end
end
