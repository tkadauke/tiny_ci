---
name: implement-issue
description: Implement a GitHub issue in an isolated worktree, commit, push, and create a PR
disable-model-invocation: true
argument-hint: <issue-number> <issue-title> <issue-body>
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - Bash
---

**This is an autonomous, non-interactive session.** You are expected to
complete the full workflow independently: implement, validate, commit, push,
and create the PR. Git operations (add, commit, push) are required — do not
stop and wait for human approval.

Implement GitHub issue #$ARGUMENTS in a worktree and create a PR.

Parse arguments: first token is the issue NUMBER, second token (quoted) is
the TITLE, remainder is the BODY.

## Authentication

Run this at the start of every session to ensure GitHub access for both
`git push` and `gh` commands:

```bash
export GH_TOKEN=$(~/.github/gh-token.sh)
```

## Worktree path

All work MUST happen in the worktree at:
```
.claude/worktrees/issue-NUMBER
```

The worktree and branch `fix/issue-NUMBER` have already been created by the
caller. Git user config is already set.

**CRITICAL: Every file path you read or write MUST be an absolute path under
the worktree. NEVER read, write, grep, or glob in the main checkout. If the
worktree does not exist, STOP IMMEDIATELY and report failure — do not fall
back to the main checkout.**

## Step 1: Understand the codebase

Read `CLAUDE.md` in the worktree root for conventions, patterns, and rules.
Note especially:
- This is Rails 7.2 on Ruby 3.2.3 (just modernized — see git log)
- The legacy scheduler/builder/modules under `lib/tiny_ci/scheduler/` etc.
  are NOT yet ported. Stubs live in `app/lib/tiny_ci/`.
- The Test::Unit suite under `test/unit/` and `test/integration/` is
  modernized and runs on Rails 7.2 (~210 runs, ~17 expected skips for
  unported subsystems — see `test/disabled/README.md`). RSpec 1.3 and
  Cucumber are gone; do not add tests in those frameworks.
- There is no rubocop configured yet

Read files relevant to the issue to understand the existing code before
making changes.

## Step 2: Implement

Follow all CLAUDE.md conventions:
- DO NOT ADD COMMENTS unless the WHY is non-obvious.
- Prefer editing existing files over creating new ones.
- Don't introduce Rails 3+ idioms blindly — read surrounding code first.
- Write tests for new functionality where the test suite supports it.
  If the area you're touching has no working tests, note that in the PR
  description rather than adding tests against an unrunnable harness.

## Step 3: Validate

Run these in the worktree directory, fixing issues between each step.

**IMPORTANT:** Never use `cd <worktree> && ...` — it triggers permission
prompts. Use `git -C` for git, `bundle -C` (or `BUNDLE_GEMFILE=...`) for
bundler.

```bash
BUNDLE_GEMFILE=.claude/worktrees/issue-NUMBER/Gemfile bundle install --quiet
BUNDLE_GEMFILE=.claude/worktrees/issue-NUMBER/Gemfile bundle exec rails zeitwerk:check
BUNDLE_GEMFILE=.claude/worktrees/issue-NUMBER/Gemfile bundle exec rails test
```

`zeitwerk:check` eager-loads every model/controller/helper and catches
load-order breakage. The test suite catches behaviour regressions; both
must be clean before pushing. Expected baseline: ~210 runs, 0 failures,
0 errors, ~17 skips (the skipped count is fine; the others must all
zero out).

If the rbenv shim triggers permission-prompt loops, invoke through the
absolute path of the versioned binary instead:
```
/Users/tkadauke/.rbenv/versions/3.2.3/bin/bundle exec rails test
```

If the change touches views/controllers, also boot the server (background)
and curl the affected route to confirm a non-500 response.

## Step 4: Commit and push

```bash
git -C .claude/worktrees/issue-NUMBER add -A
git -C .claude/worktrees/issue-NUMBER commit -m "<type>: <description>

Closes #NUMBER

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
git -C .claude/worktrees/issue-NUMBER push -u origin fix/issue-NUMBER
```

Use conventional commit types: `feat:`, `fix:`, `refactor:`, `chore:`, etc.

## Step 5: Create PR

**CRITICAL:** The `gh pr create` call MUST use the tkadauke-winston[bot]
GitHub App token so the PR is authored by the bot, not by tkadauke. Each
`Bash` tool call is a fresh subshell, so a previously-exported `GH_TOKEN`
will NOT carry over. Always inline the token on the same command line:

```bash
GH_TOKEN=$(~/.github/gh-token.sh) gh pr create --repo tkadauke/tiny_ci \
  --head fix/issue-NUMBER \
  --title "TITLE" \
  --body "$(cat <<'EOF'
## Summary
<1-3 bullet points describing what changed>

Closes #NUMBER

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)" \
  --base master
```

After creating the PR, verify it was authored by the bot:

```bash
GH_TOKEN=$(~/.github/gh-token.sh) gh pr view <PR_NUMBER> --repo tkadauke/tiny_ci --json author
```

The `author.login` MUST be `tkadauke-winston`. If it shows `tkadauke`,
the token was not picked up — close the PR, investigate, and retry.

## Step 6: Report

Print the PR URL and a brief summary of what was implemented.
