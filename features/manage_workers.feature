Feature: Manage workers
  In order to build plans on several machines in parallel
  a user
  wants to manage workers

  Scenario: Add a worker
    Given I am on the new workers page
    When I fill in "name" with "some_worker"
    And I press "Create"
    Then I should see "some_worker"

  Scenario: Get workers overview
    Given a worker "localhost"
    And an offline worker "foreignhost"
    When I am on the workers page
    Then I should see "localhost"
    And I should see "Online"
    And I should see "foreignhost"
    And I should see "Offline"

  Scenario: Edit an existing worker
    Given a worker "localhost"
    And I am on the edit page of worker "localhost"
    When I select "ssh" from "protocol"
    And I press "Update"
    Then I should see "ssh"

  Scenario: Clone an existing worker
    Given a worker "localhost"
    And I am on the page of worker "localhost"
    When I follow "Clone"
    And I fill in "name" with "clone_worker"
    And I press "Create"
    Then I should see "clone_worker"

  Scenario: Delete a worker
    Given a worker "localhost"
    And I am on the page of worker "localhost"
    When I follow "Delete"
    Then I should not see "localhost"
