Feature: Login
  In order to see protected areas
  a user
  wants to log in
  
  Scenario: Log in
    Given a user "alice" with password "foobar"
    And I am on the login page
    When I fill in "user name" with "alice"
    And I fill in "password" with "foobar"
    And I press "Login"
    Then I should see "Successfully logged in"

  Scenario: Log out
    Given I am a logged in user "alice"
    And I am on the dashboard
    When I follow "Logout"
    Then I should see "Successfully logged out"
