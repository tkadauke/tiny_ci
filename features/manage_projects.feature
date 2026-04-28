Feature: Manage projects
  In order to group plans into logical categories
  a user
  wants to manage projects
  
  Scenario: Add a new project
    Given I am on the new project page
    And I fill in "name" with "some_project"
    And I press "Create"
    Then I should see "some_project"

  Scenario: Edit an existing project
    Given a project "some_project"
    When I am on the edit project "some_project" page
    And I fill in "description" with "some description"
    And I press "Update"
    Then I should see "some description"
