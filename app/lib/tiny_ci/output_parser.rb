module TinyCI
  module OutputParser
    def self.parser_for(command)
      case command
      when "rake" then RakeParser
      when "cap"  then CapistranoParser
      end
    end
  end
end
