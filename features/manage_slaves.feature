Feature: Manage slaves
  In order to build plans on several machines in parallel
  a user
  wants to manage slaves

  Scenario: Add a slave
    Given I am on the new slaves page
    When I fill in "name" with "some_slave"
    And I press "Create"
    Then I should see "some_slave"

  Scenario: Get slaves overview
    Given a slave "localhost"
    And an offline slave "foreignhost"
    When I am on the slaves page
    Then I should see "localhost"
    And I should see "Online"
    And I should see "foreignhost"
    And I should see "Offline"

  Scenario: Edit an existing slave
    Given a slave "localhost"
    And I am on the edit page of slave "localhost"
    When I select "ssh" from "protocol"
    And I press "Update"
    Then I should see "ssh"

  Scenario: Clone an existing slave
    Given a slave "localhost"
    And I am on the page of slave "localhost"
    When I follow "Clone"
    And I fill in "name" with "clone_slave"
    And I press "Create"
    Then I should see "clone_slave"

  Scenario: Delete a slave
    Given a slave "localhost"
    And I am on the page of slave "localhost"
    When I follow "Delete"
    Then I should not see "localhost"
