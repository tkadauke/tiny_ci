Feature: Chained plans
  In order to run builds sequentialls
  a user
  wants to manage chained plans

  Scenario: Chain plans together
    Given a project "some_project"
    And a plan "some_plan" in project "some_project"
    And a plan "another_plan" in project "some_project"
    And I am on the edit plan page of plan "some_plan" in project "some_project"
    When I select "another_plan" from "plan_previous_plan_id"
    And I press "Update"
    Then I should see "Build chain"
    And I should see "another_plan"
