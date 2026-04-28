Feature: Build List
  In order to figure out how builds changed over time
  a user
  wants to see the build history of a plan
  
  Scenario: No builds finished
    Given a project "some_project"
    And a plan "some_plan" in project "some_project"
    When I am on the builds page of plan "some_plan" in project "some_project"
    Then I should see "No builds"

  Scenario: There is one finished build
    Given a project "some_project"
    And a plan "some_plan" in project "some_project"
    And a successfully finished build of plan "some_plan" in project "some_project"
    When I am on the builds page of plan "some_plan" in project "some_project"
    Then I should see "some_plan"
    And I should see "Success"
