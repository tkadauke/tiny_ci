module NavigationHelpers
  # Maps a name to a path. Used by the
  #
  #   When /^I go to (.+)$/ do |page_name|
  #
  # step definition in webrat_steps.rb
  #
  def path_to(page_name)
    case page_name
    
    when /the dashboard/
      '/'
    when /all plans page/
      all_plans_path
    when /the new project page/
      new_project_path
    when /the edit project "([^\"]*)" page/
      edit_project_path(Project.find_by_name!($1))
    when /the new plan page of project "([^\"]*)"/
      new_project_plan_path(Project.find_by_name!($1))
    when /the page of plan "([^\"]*)" in project "([^\"]*)"/
      project = Project.find_by_name!($2)
      project_plan_path(project, project.plans.find_by_name!($1))
    when /the edit plan page of plan "([^\"]*)" in project "([^\"]*)"/
      project = Project.find_by_name!($2)
      edit_project_plan_path(project, project.plans.find_by_name!($1))
    when /the builds page of plan "([^\"]*)" in project "([^\"]*)"/
      project = Project.find_by_name!($2)
      project_plan_builds_path(project, project.plans.find_by_name!($1))
    when /the new slaves page/
      new_admin_slave_path
    when /the slaves page/
      admin_slaves_path
    when /the page of slave "([^\"]*)"/
      admin_slave_path(Slave.find_by_name!($1))
    when /the edit page of slave "([^\"]*)"/
      edit_admin_slave_path(Slave.find_by_name!($1))
    when /the configuration page/
      '/admin/configuration'
    when /the help page of topic "([^\"]*)"/
      help_topic_path($1)
    when /the login page/
      login_path
    when /the signup page/
      new_user_path
    when /([^\']*)'s profile page/
      user_path(User.find_by_login!($1))
    when /my settings page/
      settings_path
    else
      raise "Can't find mapping from \"#{page_name}\" to a path.\n" +
        "Now, go and add a mapping in #{__FILE__}"
    end
  end
end

World(NavigationHelpers)
