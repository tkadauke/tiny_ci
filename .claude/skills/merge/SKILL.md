---
name: merge
description: Rebase a PR onto master, merge it, and clean up branches/worktrees
disable-model-invocation: true
argument-hint: <PR number>
allowed-tools:
  - Read
  - Edit
  - Grep
  - Glob
  - Bash
  - Skill
---

Merge PR #$ARGUMENTS into master with full cleanup.

## Step 1: Auth and PR info

```
export GH_TOKEN=$(~/.github/gh-token.sh)
gh pr view NUMBER --repo tkadauke/tiny_ci --json headRefName,state,title
```
Abort if not open.

## Step 2: Clean up worktrees on the PR branch

```
git worktree list
git worktree remove --force PATH
```

## Step 3: Fetch, checkout, and rebase

```
git fetch origin master
git checkout BRANCH
git rebase origin/master
```
Resolve conflicts following CLAUDE.md if needed.

## Step 4: Validate

```
bundle install --quiet
bundle exec rails zeitwerk:check
```
Fix any breakage, `git add -A && git commit`, repeat until clean.

## Step 5: Push and merge

```
git push --force-with-lease origin BRANCH
gh pr merge NUMBER --repo tkadauke/tiny_ci --merge --delete-branch
```

## Step 6: Close issue

```
gh issue close ISSUE_NUMBER --repo tkadauke/tiny_ci
```
Issue number = digits after `fix/issue-` in branch name.

## Step 7: Update PR tracker

Remove the merged PR from `.trackers/pr-tracker.json` (delete its entry from
the `"prs"` object). Save the file.

## Step 8: Return to master

```
git checkout master
git pull
```

## Step 9: Clean up local branch

```
git branch -D BRANCH
```

## Rules
- Never skip the rebase
- Always run `zeitwerk:check` before pushing
- If conflicts cannot be resolved, abort and tell the user
