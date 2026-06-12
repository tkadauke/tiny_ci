Feature: Worker Status
  In order to see what is going on in the background
  a user
  wants to see the current worker status on the dashboard
  
  Scenario: Observe bored worker on the dashboard
    Given a worker "localhost"
    When I am on the dashboard
    Then I should see "localhost"
    And I should see "No builds"

  Scenario: Observe busy worker on the dashboard
    Given a worker "localhost"
    And a project "some_project"
    And a plan "some_plan" in project "some_project"
    And a running build of plan "some_plan" in project "some_project" on worker "localhost"
    When I am on the dashboard
    Then I should see "some_plan"
    And I should see "Running"

  Scenario: Worker is offline
    Given an offline worker "localhost"
    When I am on the dashboard
    Then I should see "localhost"
    And I should see "offline"
