class Project < ApplicationRecord
  has_many :plans, dependent: :destroy
  has_many :root_plans, -> { where("parent_id is null") }, class_name: "Plan"

  validates :name, presence: true, uniqueness: true,
                   format: { with: /\A[a-zA-Z0-9\-_]+\z/ }

  def to_param
    name_in_database || name
  end

  def self.from_param!(param)
    find_by!(name: param)
  end
end
