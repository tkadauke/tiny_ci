class Project < ActiveRecord::Base
  has_many :plans, :dependent => :destroy
  has_many :root_plans, :class_name => 'Plan', :conditions => 'parent_id is null'
  
  validates_presence_of :name
  validates_uniqueness_of :name
  validates_format_of :name, :with => /^[a-zA-Z0-9\-_]+$/
  
  def to_param
    name_was || name
  end
  
  def self.from_param!(param)
    find_by_name!(param)
  end
end
