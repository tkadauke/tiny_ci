module TinyCI
  DSL.class_eval do
    def cap(*tasks)
      environment = tasks.extract_options!
      TinyCI::Steps::Deployer::Capistrano.new(@build, tasks, @pwd, environment).run!
    end
  end
end
