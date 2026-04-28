---
name: process-prs
description: Review open PRs and address feedback from tkadauke
disable-model-invocation: true
argument-hint: "[--limit N]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - Bash
  - Agent
---

Process open PRs for tkadauke/tiny_ci. Address review feedback from humans,
skip PRs with no new feedback.

**Limit:** Process up to $ARGUMENTS PRs with actionable feedback (default: 3).

## Step 1: Authentication and cleanup

```
export GH_TOKEN=$(~/.github/gh-token.sh)
bash ${CLAUDE_SKILL_DIR}/cleanup.sh
```

## Step 2: Fetch and select PRs

```
gh pr list --repo tkadauke/tiny_ci --state open --json number,title,headRefName,author
```

**Do NOT post-filter this list with `--jq '.[0:N]'`, `head`, `head_limit`,
or any other top-N truncation.** Pull every open PR and let the tracker
comparison below decide which have new feedback. Sorting by `updatedAt` and
truncating is fragile — it will silently drop PRs in edge cases.

Only act on PRs authored by `tkadauke` or `tkadauke-winston[bot]`.

### Step 2a: Self-heal the tracker

GitHub is the source of truth for which PRs exist; the tracker is just a
cache of "when did we last look at this PR." A PR can land in the tracker
via several paths (process-issues seeding, manual `implement-issue`
invocation, hand-authored PR by tkadauke), and we must not depend on any
single path having run.

For every open PR returned above that is authored by `tkadauke` or
`tkadauke-winston[bot]` AND is missing from `.trackers/pr-tracker.json`,
add an entry with `last_processed_at: "1970-01-01T00:00:00Z"` so the
feedback comparison below treats it as "never processed, look at it." Save
the tracker.

Also remove any tracker entries whose PR is no longer open (merged/closed).

### Step 2b: Filter to PRs with new feedback

For each remaining tracked PR, fetch feedback:
```
gh pr view NUMBER --repo tkadauke/tiny_ci --json reviews,comments
```

Skip PRs with no new human feedback since `last_processed_at`. Only
@tkadauke is a human. Ignore @tkadauke-winston[bot] comments.

Take the first N PRs with actionable feedback.

## Step 3: For each PR with feedback

### Apply fixes

1. Ensure the PR branch is not checked out in main tree:
   `git checkout master` (if needed)
2. `git worktree add .claude/worktrees/pr-NUMBER BRANCH`
3. `git -C .claude/worktrees/pr-NUMBER config user.name "tkadauke-winston[bot]"`
4. `git -C .claude/worktrees/pr-NUMBER config user.email "tkadauke-winston[bot]@users.noreply.github.com"`

**If delegating to a sub-Agent**, the agent prompt MUST include this verbatim
block to prevent broad filesystem scans:
> All file operations must be absolute paths under
> `.claude/worktrees/pr-NUMBER/`. Do NOT run `find`, `glob`, or `grep` against
> `/Users/tkadauke` or `~` — stay inside the worktree and (when needed)
> `~/.github/gh-token.sh` for auth.

5. Make the requested changes in the worktree following CLAUDE.md
6. Validate (in worktree, fix and repeat until clean):
   ```
   BUNDLE_GEMFILE=.claude/worktrees/pr-NUMBER/Gemfile bundle install --quiet
   BUNDLE_GEMFILE=.claude/worktrees/pr-NUMBER/Gemfile bundle exec rails zeitwerk:check
   BUNDLE_GEMFILE=.claude/worktrees/pr-NUMBER/Gemfile bundle exec rails test
   ```
   `zeitwerk:check` covers load-order; the test suite covers behaviour.
   Expected baseline: ~210 runs, 0 failures, 0 errors, ~17 skips. Do not
   consider a PR ready unless both are clean. If the rbenv shim triggers
   permission-prompt loops, invoke through the absolute path of the
   versioned binary instead (`/Users/tkadauke/.rbenv/versions/3.2.3/bin/bundle ...`).
7. `git -C .claude/worktrees/pr-NUMBER add -A && git -C .claude/worktrees/pr-NUMBER commit -m "..."`
8. `git -C .claude/worktrees/pr-NUMBER push origin BRANCH`
9. `git worktree remove .claude/worktrees/pr-NUMBER`
10. Update `.trackers/pr-tracker.json`

### On error — clean up

```
git worktree remove --force .claude/worktrees/pr-NUMBER
```
Log error, continue to next PR.

## Step 4: Learn from feedback

After all PRs, scan feedback for general lessons (coding conventions,
style preferences, common mistakes). If new lessons found that aren't
in CLAUDE.md:

1. `git fetch origin master`
2. `git worktree add .claude/worktrees/claude-md -b winston/update-claude-md-lessons origin/master`
3. Update CLAUDE.md with concise instructions
4. `git -C .claude/worktrees/claude-md push -u origin winston/update-claude-md-lessons`
5. `gh pr create --repo tkadauke/tiny_ci --head winston/update-claude-md-lessons --title "..." --base master`
6. `git worktree remove .claude/worktrees/claude-md`

Skip if no new lessons found.

## State file format

`.trackers/pr-tracker.json`:
```json
{
  "prs": {
    "14": {
      "last_processed_at": "2026-04-27T12:00:00Z",
      "last_human_feedback_at": "2026-04-27T11:00:00Z",
      "iterations": 2
    }
  }
}
```

Save state after EACH PR (crash-safe).

## Rules
- **NO ASYNC AGENT MAY EVER TOUCH THE MAIN WORKTREE.** Always create the
  worktree BEFORE launching any agent. If worktree creation fails, FAIL —
  do not launch the agent or fall back to the main checkout.
- NEVER modify the main checkout — always use worktrees in .claude/worktrees/
- Only push to PRs authored by tkadauke or tkadauke-winston[bot]
- Never treat tkadauke-winston[bot] comments as feedback
- Follow all CLAUDE.md conventions
