Feature: Manage plans
  In order to get a quick overview about a plan
  a user
  wants to see plan statistics
  
  Scenario: View latest build status
    Given a project "some_project"
    And a plan "some_plan" in project "some_project"
    And a successfully finished build of plan "some_plan" in project "some_project"
    When I am on the page of plan "some_plan" in project "some_project"
    Then I should see "success"

  Scenario: View build weather
    Given a project "some_project"
    And a plan "some_plan" in project "some_project"
    And a successfully finished build of plan "some_plan" in project "some_project"
    When I am on the page of plan "some_plan" in project "some_project"
    Then I should see "5 of the last 5 builds were successful"

  Scenario: Go to latest build
    Given a project "some_project"
    And a plan "some_plan" in project "some_project"
    And a successfully finished build of plan "some_plan" in project "some_project"
    When I am on the page of plan "some_plan" in project "some_project"
    And I follow "Latest Build"
    Then I should see "Build output"
