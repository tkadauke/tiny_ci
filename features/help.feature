Feature: Help
  In order to figure out how everything works
  a user
  wants to look at the documentation
  
  Scenario: Show help
    Given a help topic "test"
    When I am on the help page of topic "test"
    Then I should see "Test Page"
