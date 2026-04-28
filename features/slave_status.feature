Feature: Slave Status
  In order to see what is going on in the background
  a user
  wants to see the current slave status on the dashboard
  
  Scenario: Observe bored slave on the dashboard
    Given a slave "localhost"
    When I am on the dashboard
    Then I should see "localhost"
    And I should see "No builds"

  Scenario: Observe busy slave on the dashboard
    Given a slave "localhost"
    And a project "some_project"
    And a plan "some_plan" in project "some_project"
    And a running build of plan "some_plan" in project "some_project" on slave "localhost"
    When I am on the dashboard
    Then I should see "some_plan"
    And I should see "Running"

  Scenario: Slave is offline
    Given an offline slave "localhost"
    When I am on the dashboard
    Then I should see "localhost"
    And I should see "offline"
