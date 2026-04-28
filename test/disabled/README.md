# Disabled tests

These tests exercise code under `lib/tiny_ci/` (scheduler, builder/runner,
DSL, SCM, Shell, OutputParser, Reports) and `script/builder` that has not
yet been ported to modern Rails — see `docs/modernize.md` §3.5.

The web tier in `app/lib/tiny_ci/` only stubs these namespaces. As long as
the real implementations remain Rails 2-shaped and unloaded, these tests
cannot run; they are parked here so `bin/rails test` exercises only the
ported code.

When porting one of those subsystems, move the corresponding file back
under `test/unit/` or `test/functional/` and modernize it in the same PR.
