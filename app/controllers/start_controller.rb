class StartController < ApplicationController
  def index
    @slaves = Slave.all
  end
end
