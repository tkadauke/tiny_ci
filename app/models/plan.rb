class Plan < ApplicationRecord
  belongs_to :project
  has_many :builds, dependent: :destroy
  has_many :running_builds, -> { where(status: "running") }, class_name: "Build"
  has_many :pending_builds, -> { where(status: "pending") }, class_name: "Build"

  has_many :weather_relevant_builds,
           -> { where("finished_at is not null").order("created_at DESC").limit(5) },
           class_name: "Build"
  has_one :last_finished_build,
          -> { where("finished_at is not null").order("created_at DESC") },
          class_name: "Build"
  has_one :last_successful_build,
          -> { where("status = ? and finished_at is not null", "success").order("created_at DESC") },
          class_name: "Build"
  has_one :last_failed_build,
          -> { where("status in (?) and finished_at is not null", %w[error failure]).order("created_at DESC") },
          class_name: "Build"

  belongs_to :previous, class_name: "Plan", foreign_key: "previous_plan_id", optional: true
  has_one :next, class_name: "Plan", foreign_key: "previous_plan_id"

  acts_as_tree

  validates :name, presence: true,
                   uniqueness: { scope: :project_id },
                   format: { with: /\A[a-zA-Z0-9\-_]+\z/ }
  validates :project_id, presence: true

  before_update :break_chain_if_child

  def self.find_for_cloning!(name)
    plan = find_by!(name: name)
    plan.id = nil
    plan.name = nil
    plan.instance_variable_set(:@new_record, true)
    plan
  end

  def self.new_with_parent(name)
    new(parent: find_by!(name: name))
  end

  def has_children?
    !children.empty?
  end

  def build!(attributes = {})
    builds.create(attributes.merge(status: "pending"))
  end

  def build_children!(build)
    children.each { |child| child.build_with_parent_build!(build) }
  end

  def build_with_parent_build!(build)
    builds.create(status: "pending", parent: build, parameters: build.environment)
  end

  def build_next!(parent)
    self.next.build_with_parent_build!(parent) if self.next
  end

  def buildable?
    running_builds.empty?
  end

  def to_param
    name_in_database || name
  end

  def self.from_param!(param)
    find_by!(name: param)
  end

  def standalone?
    parent_id.blank?
  end

  def update_build_stats!
    fill_build_count = 5 - weather_relevant_builds.size

    self.weather = weather_relevant_builds.collect { |build| build.good? ? 1 : 0 }.sum + fill_build_count
    self.status = last_finished_build&.status
    self.last_build_time = last_finished_build&.duration
    self.last_succeeded_at = last_successful_build&.finished_at
    self.last_failed_at = last_failed_build&.finished_at
    save
  end

  def needed_resources
    TinyCI::Resources::Parser.parse(requirements)
  end

  protected

  def break_chain_if_child
    if parent
      self.previous = nil
      self.next = nil
    end
    true
  end
end
