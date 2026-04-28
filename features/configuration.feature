Feature: Configuration
  In order to customize the CI server
  a user
  wants to set configuration options over the user interface

  Scenario: Update configuration options
    Given I am on the configuration page
    When I fill in "config_base_path" with "/some/base/path"
    And I press "Update"
    Then the "Base Path" field should contain "/some/base/path"
