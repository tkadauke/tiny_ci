class HelpTopicsController < ApplicationController
  def index
    show
    render :action => 'show'
  end
  
  def show
    @help_topic = HelpTopic.from_param!(params[:id])
  end
end
