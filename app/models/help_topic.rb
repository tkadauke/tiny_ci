class HelpTopic
  def initialize(topic)
    @topic = topic
  end
  
  def self.from_param!(param)
    result = new(param.blank? ? "index" : [param].flatten.join('/'))
    result.load
    result
  end
  
  def title
    @title ||= (load.first || "")
  end
  
  def text
    @text ||= (load[1..-1] || []).join("\n")
  end
  
  def to_param
    @topic
  end
  
  def load
    @file_contents ||= File.read(file_name).split("\n")
  end

private
  def file_name
    "#{RAILS_ROOT}/doc/help_topics/#{@topic}.textile"
  end
end
