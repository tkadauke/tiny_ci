require "csv"

class Build < ApplicationRecord
  include OverridesField

  attr_reader :shell
  attr_accessor :source_control, :previous_changes_for_observer

  validates :plan_id, presence: true

  serialize :parameters, type: Hash, coder: YAML

  delegate :name, :repository_url, :requirements, :needed_resources, :project, to: :plan

  belongs_to :plan
  belongs_to :slave, optional: true
  belongs_to :starter, class_name: "User", optional: true
  acts_as_list scope: :plan_id
  acts_as_tree

  scope :pending,  -> { where(status: "pending") }
  scope :finished, -> { where("status != ? and status != ?", "pending", "running") }

  overrides_field :revision, from: :parent,
                             if: ->(build) { build.parent && build.repository_url == build.parent.repository_url }

  include Turbo::Broadcastable

  before_save { |build| build.previous_changes_for_observer = build.changes }
  after_update :update_stats_if_neccessary
  after_create_commit  :broadcast_queue_update
  after_update_commit  :broadcast_realtime_updates
  after_create_commit  :report_to_github
  after_update_commit  :report_to_github_on_status_change

  def cleanup_for_background
    @shell = nil
    @source_control = nil
  end

  def duration
    finished_at && started_at ? (finished_at - started_at) : nil
  end

  def environment
    @environment ||= (parameters || {})
  end

  def current_environment
    slave.current_environment.merge(environment)
  end

  def assign_to!(slave)
    update(slave: slave)
  end

  def buildable?
    plan.buildable? && pending?
  end

  def finished?
    good? || bad?
  end

  %i[running pending waiting success error failure canceled stopping stopped].each do |status_name|
    define_method("#{status_name}?") { status == status_name.to_s }
  end

  def good?
    success?
  end

  def bad?
    error? || failure? || canceled? || stopped?
  end

  def has_children?
    !children.empty?
  end

  def build!
    @shell = TinyCI::Shell.open(self)

    create_base_directory
    TinyCI::DSL.evaluate(self)
    if plan.has_children?
      update(status: "waiting")
    else
      update(status: "success", finished_at: Time.now)
    end
  rescue SignalException
  rescue TinyCI::BuildStopped
    flush_output!
    update(status: "stopped", finished_at: Time.now)
  rescue TinyCI::Shell::CommandExecutionFailed
    flush_output!
    update(status: "failure", finished_at: Time.now)
  rescue Exception => e
    add_lines_to_output(Time.now, "runner", [e.message] + e.backtrace)
    flush_output!
    update(status: "error", finished_at: Time.now)
  ensure
    finished
  end

  # Cooperative stop. There is no separate process to signal — flipping the
  # build's status to "stopping" is observed by the running shell loop the
  # next time it polls (see TinyCI::Shell::Localhost#check_for_stop!), which
  # raises TinyCI::BuildStopped and lets build! finalize as "stopped".
  def stop!
    TinyCI::Scheduler::Client.stop(self)
  end

  def finished
    parent.child_finished(self) if parent
    plan.build_next!(self) if success?
  end

  def child_finished(child)
    if waiting? && children.all?(&:finished?)
      success = children.all?(&:success?)
      update(status: (success ? "success" : "failure"), finished_at: Time.now)
      plan.build_next!(self) if success?
    end
  end

  def workspace_path
    "#{slave.base_path}/#{project.name}/#{name}"
  end

  def build_output
    @build_output ||= []
  end

  def add_to_output(time, command, lines)
    add_lines_to_output(time, command, lines)
    flush_output! if updated_at < 1.second.ago
  end

  def add_lines_to_output(time, command, lines)
    [lines].flatten.each do |line|
      build_output << CSV.generate_line([time.to_f, command, line.strip])
    end
  end

  def flush_output!
    return if new_record?
    update_columns(output: build_output.join, updated_at: Time.current)
  end

  def to_param
    position.to_s
  end

  def self.from_param!(param)
    find_by!(position: param)
  end

  def update_stats_if_neccessary
    if previous_changes_for_observer&.key?("status") && finished?
      plan.update_build_stats!
    end
  end

  private

  def create_base_directory
    @shell.mkdir(slave.base_path)
  end

  def broadcast_queue_update
    broadcast_refresh_to("queue")
  end

  def broadcast_realtime_updates
    changed = previous_changes_for_observer || {}
    if changed.key?("output") || changed.key?("status")
      broadcast_refresh_to("build_#{name}_#{position}")
    end
    if changed.key?("status")
      broadcast_refresh_to("queue")
      TinyCI::Notifier::Base.notify(self) if defined?(TinyCI::Notifier::Base)
    end
  end

  def report_to_github
    TinyCI::GitHub::CheckRunReporter.report(self) if defined?(TinyCI::GitHub::CheckRunReporter)
  end

  def report_to_github_on_status_change
    return unless (previous_changes_for_observer || {}).key?("status")
    TinyCI::GitHub::CheckRunReporter.report(self) if defined?(TinyCI::GitHub::CheckRunReporter)
  end
end
