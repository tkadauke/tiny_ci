Feature: Recently Finished Builds
  In order to see what has been going on in the background
  a user
  wants to see recently finished builds on the dashboard
  
  Scenario: No recently finished build yet
    When I am on the dashboard
    Then I should see "No builds"

  Scenario: There is one recently finished build
    Given a slave "localhost"
    And a project "some_project"
    And a plan "some_plan" in project "some_project"
    And a successfully finished build of plan "some_plan" in project "some_project" on slave "localhost"
    When I am on the dashboard
    Then I should see "some_plan"
    And I should see "success"
