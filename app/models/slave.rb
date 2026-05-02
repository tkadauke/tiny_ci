class Slave < ApplicationRecord
  include OverridesField

  encrypts :password

  serialize :environment_variables, type: Hash, coder: YAML

  before_save :cleanup_environment

  # Strong params produce ActiveSupport::HashWithIndifferentAccess, which
  # the YAML coder rejects with Psych::DisallowedClass. Coerce to plain
  # Hash on assignment so the value can serialize.
  def environment_variables=(value)
    super(value.respond_to?(:to_hash) ? value.to_hash : value)
  end

  has_many :builds, dependent: :nullify
  has_many :running_builds, -> { where(status: "running") }, class_name: "Build"

  scope :least_busy, -> {
    # `where.not(offline: true)` would generate `offline != TRUE`, which
    # excludes rows where `offline` IS NULL (SQL three-valued logic).
    # Match both NULL and false explicitly so newly created slaves count.
    where(offline: [false, nil])
      .left_joins(:running_builds)
      .group("slaves.id")
      .order(Arel.sql("COUNT(builds.id) ASC"))
  }

  validates :name, presence: true, uniqueness: true
  validates :protocol, presence: true

  overrides_field :base_path, from: "TinyCI::Config"

  def self.find_for_cloning!(name)
    slave = from_param!(name)
    slave.id = nil
    slave.name = nil
    slave.instance_variable_set(:@new_record, true)
    slave
  end

  def current_environment
    TinyCI::Config.environment.merge(environment)
  end

  def environment
    environment_variables.each_with_object({}) { |(_, ev), hash| hash[ev["key"]] = ev["value"] }
  end

  def busy?
    !free?
  end

  def free?
    running_builds.empty?
  end

  def self.find_free_slave_for(build)
    least_busy.to_a.find { |slave| slave.can_build_now?(build) }
  end

  def all_resources
    TinyCI::Resources::Parser.parse(capabilities)
  end

  def free_resources
    res = all_resources
    running_builds.each { |build| res -= build.needed_resources }
    res
  end

  def can_build_now?(build)
    return false if maximum_running_builds_reached?
    return false unless can_ever_build?(build)

    free_resources.includes?(build.needed_resources)
  end

  def can_ever_build?(build)
    return false unless all_resources.includes?(build.needed_resources)

    req = unnumbered_resources(build.requirements)
    cap = unnumbered_resources(capabilities)

    (req - cap).empty?
  end

  def to_param
    name
  end

  def self.from_param!(param)
    find_by!(name: param)
  end

  protected

  def cleanup_environment
    return if environment_variables.nil?
    self.environment_variables = environment_variables.reject { |_, kv| kv["key"].blank? }
  end

  def unnumbered_resources(res)
    (res || "").split(",").map(&:strip).select { |x| x.to_i.zero? }.map(&:downcase)
  end

  def maximum_running_builds_reached?
    max_builds.to_i.positive? && running_builds.count >= max_builds
  end
end
