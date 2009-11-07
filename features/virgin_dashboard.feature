Feature: Virgin Dashboard
  In order to get a starting point
  a user
  wants to have some useful links on a fresh dashboard
  
  Scenario: Visit the Dashboard for the first time
    Given I am on the dashboard
    Then I should see "Quick links"
