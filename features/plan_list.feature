Feature: Plan list
  In order to know the status of every plan
  a user
  wants to see plan all plans at once
  
  Scenario: View all plans
    Given a project "some_project"
    And a plan "some_plan" in project "some_project"
    And a successfully finished build of plan "some_plan" in project "some_project"
    When I am on the all plans page
    Then I should see "some_plan"
