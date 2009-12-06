module Webrat
  module Locators
    class RemoteLinkLocator < LinkLocator # :nodoc:
      def locate
        RemoteLink.load(@session, link_element)
      end

      def error_message
        "Could not find remote link with text or title or id #{@value.inspect}"
      end
    end

    def find_remote_link(text_or_title_or_id) #:nodoc:
      RemoteLinkLocator.new(@session, dom, text_or_title_or_id).locate!
    end
  end
end

module Webrat
  class RemoteLink < Link #:nodoc:
  protected
    def href
      onclick[/Ajax.Request\('(.*?)'/,1]
    end
    
    def http_method
      onclick[/method:'(.*?)'/,1]
    end
  end
end

class Webrat::Session
  def_delegators :current_scope, :click_remote_link
end

module Webrat
  module Methods #:nodoc:
    delegate_to_session :click_remote_link
  end
end

class Webrat::Scope
  def click_remote_link(text_or_title_or_id)
    find_remote_link(text_or_title_or_id).click
  end
end
