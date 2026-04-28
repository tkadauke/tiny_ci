# Cucumber feature specs

These 20 `.feature` files plus their step definitions describe the
user-facing behavior of TinyCI as it stood on the last Rails 2 release.

The Cucumber + Webrat + RSpec 1.3 stack they rely on is not part of the
modern Gemfile, so they do not run today. They are kept on disk as a
behavior spec to drive the system-test port called for in
`docs/modernize.md` §3.3:

> Add **system tests** using Rails system test infrastructure (Capybara
> + Cuprite) to replace the Cucumber/Webrat feature tests. Cucumber is
> high-ceremony; the existing `.feature` files can be converted to
> RSpec feature specs or Rails system tests.

When converting one of these to a Rails system test, move the
corresponding `.feature` file into a corresponding `_test.rb` under
`test/system/` (or delete the `.feature` once the new test fully covers
the same behavior).
