class Api::HelpTopicsController < Api::BaseController
  rescue_from Errno::ENOENT, with: :not_found

  def show
    help_topic = HelpTopic.from_param!(params[:id])
    render json: {
      title: help_topic.title,
      html: render_help_text(help_topic.text)
    }
  end

  private

  def render_help_text(text)
    RedCloth.new(rewrite_help_links(text)).to_html
  end

  def rewrite_help_links(text)
    text.gsub(/":(?!https?:\/\/)([^\s"]+)/, '":/help_topics/\1')
  end

  def not_found
    render json: { error: "Not found" }, status: :not_found
  end
end
