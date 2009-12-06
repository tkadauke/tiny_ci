Feature: Build Queue
  In order to see what is about to happen in the background
  a user
  wants to see the build queue on the dashboard
  
  Scenario: No build in queue
    When I am on the dashboard
    Then I should see "No builds"

  Scenario: There is one build in the queue
    Given a project "some_project"
    And a plan "some_plan" in project "some_project"
    And a pending build of plan "some_plan" in project "some_project"
    When I am on the dashboard
    Then I should see "some_plan"
    And I should see "pending"

  Scenario: Cancel pending build in queue
    Given a project "some_project"
    And a plan "some_plan" in project "some_project"
    And a pending build of plan "some_plan" in project "some_project"
    When I am on the dashboard
    And I follow remote link "Stop"
    Then I should see "some_plan"
    And I should see "stopping"
