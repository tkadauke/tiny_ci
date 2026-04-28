Feature: Profiles
  In order to learn about other users
  a user
  wants to see their profiles
  
  Scenario: Show profile
    Given a user "alice"
    When I am on alice's profile page
    Then I should see "alice"

  Scenario: Edit profile
    Given I am a logged in user "alice"
    And I am on alice's profile page
    When I follow "Edit profile"
    And I fill in "user_email" with "alice@example.com"
    And I press "Update"
    Then I should see "Successfully updated alice's profile"
