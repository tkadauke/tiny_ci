module HelpTopicsHelper
  def render_help_text(text)
    RedCloth.new(text.gsub(/\":([a-z]+)/) { $1 == 'http' ? '":' + $1 : %{":/help_topics/#{$1}} }).to_html
  end
  
  def help_link(topic_name)
    link_to 'Help', help_topic_path(topic_name)
  end
end
