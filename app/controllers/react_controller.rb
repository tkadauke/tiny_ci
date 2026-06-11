class ReactController < ApplicationController
  def index
    @react_app = true
    render html: "", layout: "application"
  end
end
