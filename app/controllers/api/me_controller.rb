class Api::MeController < Api::BaseController
  CAPABILITIES = %i[
    can_configure_slaves
    can_configure_system_variables
    can_create_accounts
  ].freeze

  def show
    return render json: { guest: true } unless logged_in?

    render json: current_user_payload
  end

  private

  def current_user_payload
    {
      login: current_user.login,
      email: current_user.email,
      role: current_user.role.presence || "user",
      initial_admin: current_user.initial_admin?
    }.merge(capability_payload)
  end

  def capability_payload
    CAPABILITIES.index_with do |capability|
      current_user.public_send("#{capability}?")
    end
  end
end
