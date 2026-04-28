Feature: Settings
  In order to customize individual options
  a user
  wants to edit their configuration
  
  Scenario: Change configuration
    Given I am a logged in user "alice"
    And I am on my settings page
    When I fill in "Growl Host" with "localhost"
    And I press "Update"
    Then I should see "Successfully updated configuration"
    And the "Growl Host" field should contain "localhost"
