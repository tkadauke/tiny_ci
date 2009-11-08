Feature: Child plans
  In order to parallelize builds
  a user
  wants to manage child plans

  Scenario: Create a child plan
    Given a project "some_project"
    And a plan "some_plan" in project "some_project"
    And I am on the page of plan "some_plan" in project "some_project"
    When I follow "New Child Plan"
    And I fill in "name" with "child_plan"
    And I press "Create"
    Then I should see "some_plan"
    And I should see "child_plan"

  Scenario: Convert plan to child plan
    Given a project "some_project"
    And a plan "some_plan" in project "some_project"
    And a plan "another_plan" in project "some_project"
    And I am on the page of plan "another_plan" in project "some_project"
    When I follow "Convert to Child Plan"
    And I select "some_plan" from "plan_parent_id"
    And I press "Update"
    Then I should see "child of some_plan"
    
  Scenario: Convert child plan to standalone plan
    Given a project "some_project"
    And a plan "some_plan" in project "some_project"
    And a child plan "another_plan" of parent "some_plan" in project "some_project"
    And I am on the page of plan "another_plan" in project "some_project"
    When I follow "Convert to Standalone Plan"
    Then I should not see "some_plan"
  
  Scenario: Move plan to another parent
    Given a project "some_project"
    And a plan "some_plan" in project "some_project"
    And a plan "another_plan" in project "some_project"
    And a child plan "child_plan" of parent "some_plan" in project "some_project"
    And I am on the page of plan "child_plan" in project "some_project"
    When I follow "Move to another Parent"
    And I select "another_plan" from "plan_parent_id"
    And I press "Update"
    Then I should see "child of another_plan"
