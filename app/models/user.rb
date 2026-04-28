class User < ApplicationRecord
  has_secure_password

  validates :login, presence: true, uniqueness: true,
                    format: { with: /\A[a-zA-Z0-9\-_]+\z/ }
  validates :email, presence: true, uniqueness: true

  attr_readonly :role

  after_initialize :extend_with_role

  def to_param
    login
  end

  def self.from_param!(param)
    find_by!(login: param)
  end

  def initial_admin?
    false
  end

  def to_user
    self
  end

  def config
    @config ||= User::Configuration.new(self)
  end

  private

  def extend_with_role
    if role.blank?
      extend Role::User
    else
      extend "Role::#{role.classify}".constantize
    end
  end
end
