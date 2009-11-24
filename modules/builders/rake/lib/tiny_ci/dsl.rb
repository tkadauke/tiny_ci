module TinyCI
  DSL.class_eval do
    def rake(*tasks)
      environment = tasks.extract_options!
      TinyCI::Steps::Builder::Rake.new(@build, tasks, @pwd, environment).run!
    end
  end
end
