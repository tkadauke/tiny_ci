Feature: Manage plans
  In order to get things built
  a user
  wants to manage plans
  
  Scenario: Add a new plan
    Given a project "some_project"
    And I am on the new plan page of project "some_project"
    When I fill in "name" with "some_plan"
    And I press "Create"
    Then I should see "some_plan"

  Scenario: Edit an existing plan
    Given a project "some_project"
    And a plan "some_plan" in project "some_project"
    And I am on the edit plan page of plan "some_plan" in project "some_project"
    When I fill in "description" with "some description"
    And I press "Update"
    Then I should see "some description"

  Scenario: Clone an existing plan
    Given a project "some_project"
    And a plan "some_plan" in project "some_project"
    And I am on the page of plan "some_plan" in project "some_project"
    When I follow "Clone"
    And I fill in "name" with "clone_plan"
    And I press "Create"
    Then I should see "clone_plan"

  Scenario: Build a plan manually
    Given a project "some_project"
    And a plan "some_plan" in project "some_project"
    And I am on the page of plan "some_plan" in project "some_project"
    When I press "Build now"
    Then I should see "some_plan"
    And I should see "Building plan some_plan"

  Scenario: Build a plan manually as logged in user
    Given a project "some_project"
    And a plan "some_plan" in project "some_project"
    And I am a logged in user "alice"
    And I am on the page of plan "some_plan" in project "some_project"
    When I press "Build now"
    Then I should see "alice"

  Scenario: Delete a plan
    Given a project "some_project"
    And a plan "some_plan" in project "some_project"
    And I am on the page of plan "some_plan" in project "some_project"
    When I follow "Delete"
    Then I should not see "some_plan"
