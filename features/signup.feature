Feature: Signup
  In order to see protected areas
  a user
  wants to sign up
  
  Scenario: Sign up as initial admin
    Given I am the initial admin
    And I am on the signup page
    When I fill in "user_login" with "alice"
    And I fill in "user_password" with "foobar"
    And I fill in "user_password_confirmation" with "foobar"
    And I fill in "user_email" with "alice@example.com"
    And I press "Create account"
    Then I should see "Successfully created account"
    And I should see "alice"
    And I should see "Configuration"

  Scenario: Sign up as guest
    Given a user "alice"
    And I am a guest
    And I am on the signup page
    When I fill in "user_login" with "bob"
    And I fill in "user_password" with "foobar"
    And I fill in "user_password_confirmation" with "foobar"
    And I fill in "user_email" with "bob@example.com"
    And I press "Create account"
    Then I should see "Successfully created account"
    And I should see "bob"
    And I should not see "Configuration"

  Scenario: Add an account as admin
    Given I am a logged in admin "alice"
    And I am on the signup page
    When I fill in "user_login" with "bob"
    And I fill in "user_password" with "foobar"
    And I fill in "user_password_confirmation" with "foobar"
    And I fill in "user_email" with "bob@example.com"
    And I press "Create account"
    Then I should see "Successfully created account"
    And I should see "alice"
