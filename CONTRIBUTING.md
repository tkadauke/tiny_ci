# Contributing to TinyCI

Thanks for taking the time to contribute. This guide covers the conventions
this repository expects from both human contributors and AI coding agents.
For a deeper architectural overview, read `CLAUDE.md`.

## Branch Naming

- Bot-driven PRs (opened by `tkadauke-winston[bot]` from the
  `implement-issue` skill) use `fix/issue-N`, where `N` is the GitHub
  issue number being closed.
- Human-authored branches can use any short, descriptive name
  (`tkadauke/refactor-scheduler`, `add-trilogy-config`, etc.). There is
  no hard rule beyond "keep it readable."

## Commit Messages

This project uses [Conventional Commits](https://www.conventionalcommits.org/)
for the subject line:

- `feat:` — a new user-visible feature
- `fix:` — a bug fix
- `refactor:` — a non-behavioural code change
- `chore:` — tooling, dependencies, build, CI
- `docs:` — documentation only
- `test:` — adding or fixing tests

Subject lines should be short (under ~70 chars). Use the body for the
"why," not the "what." When a commit closes an issue, include
`Closes #N` in the body.

## Test Naming

The test suite uses Test::Unit + Mocha. Test names use the imperative
`should X` form, matching the rest of the suite:

```ruby
test "should validate presence of name" do
  # ...
end

test "should clone a worker" do
  # ...
end
```

Don't drift to `test "saves X"` or `test "regression for Y"` — match what
the surrounding file does. See the "Testing" section of `CLAUDE.md` for
the runnable harness, expected counts, and known skips.

Run tests locally before pushing:

```
bin/rails test
bin/rails zeitwerk:check
```

CI (`.github/workflows/ci.yml`) runs the same two commands plus
`bundle-audit` on every push and PR.

## AI-Agent Workflows

This repo is set up for autonomous contributions from the
`tkadauke-winston[bot]` GitHub App via Claude Code skills. The skills
live under `.claude/skills/`:

- `process-issues` — triages open issues, deciding which can be picked up
  autonomously.
- `implement-issue` — runs in a dedicated worktree
  (`.claude/worktrees/issue-N`), implements the fix, commits, pushes, and
  opens a PR.
- `process-prs` — reviews and merges open PRs once CI is green.
- `merge` — helper for merging a single PR.

If you are an AI agent contributing through one of these skills, follow
the conventions in `CLAUDE.md` precisely — particularly the test naming
rules and the "do not introduce Rails 2 idioms" guidance.

## Code Conventions

`CLAUDE.md` is the source of truth for code-level conventions: where new
build steps, SCMs, and notifiers live (`app/lib/tiny_ci/`), how
`TinyCI::DSL` is extended, the YAML / `_html` translation gotchas, and
the Mocha patterns the suite uses. Read it before opening a non-trivial
PR.
