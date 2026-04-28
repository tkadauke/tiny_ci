---
name: process-issues
description: Scan GitHub issues and create PRs or comment with questions
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

Process open GitHub issues for tkadauke/tiny_ci. Create PRs where possible,
or comment with questions if blocked.

**Limit:** Process up to $ARGUMENTS actionable issues (default: 3 if not specified).

## Step 1: Authentication and cleanup

```
export GH_TOKEN=$(~/.github/gh-token.sh)
bash ${CLAUDE_SKILL_DIR}/cleanup.sh
```

## Step 2: Fetch and select issues

```
gh issue list --repo tkadauke/tiny_ci --state open --limit 200 --json number,title,body,labels,createdAt,updatedAt
```

**Do NOT post-filter this list with `--jq '.[0:N]'`, `head`, `head_limit`,
or any other top-N truncation.** Pull every open issue and let the tracker
filtering below decide what's actionable. Truncating by `createdAt`/`updatedAt`
silently drops issues that fall just outside the cutoff.

### Step 2a: Self-heal the tracker

GitHub is the source of truth for which issues exist; the tracker is just a
cache of "what we did with this issue last time." Issues can change state
outside our orchestration (closed manually, commented by tkadauke directly,
labelled, deleted), so reconcile before filtering — do not rely on the
tracker being authoritative.

For every open issue returned above that is missing from
`.trackers/issue-tracker.json`, add a sentinel entry:
```json
{
  "last_seen_at": "1970-01-01T00:00:00Z",
  "last_processed_at": "1970-01-01T00:00:00Z",
  "status": null,
  "pr_number": null,
  "comment_id": null,
  "last_human_comment_at": null
}
```
This makes the issue eligible for evaluation in Step 2b.

Also evict tracker entries for issues that are no longer open (closed,
deleted) — they should not weigh against future fairness rounds.

Save the tracker.

### Step 2b: Filter to actionable issues

Read the (now self-healed) `.trackers/issue-tracker.json` and filter:
- `pr_created` with open PR → skip (process-prs handles it)
- `pr_created` with closed-without-merge PR → retry
- `commented` with no new human reply since `last_processed_at` → skip
- `skipped` with no updates since `last_processed_at` → skip
- `error` → always retry
- sentinel (just added in Step 2a) → eligible

Apply round-robin fairness: pick from newest third, then oldest third,
then middle third. Take up to N issues.

## Step 3: For each issue

Fetch full issue: `gh issue view NUMBER --json body,comments`

Only @tkadauke comments are actionable feedback.
Ignore @tkadauke-winston[bot] comments — that is YOUR bot account.

### If actionable — create a PR

1. `git fetch origin master` (ensure origin/master is up to date)
2. `git branch -D fix/issue-NUMBER` (if exists, no open PR)
3. `git worktree add .claude/worktrees/issue-NUMBER -b fix/issue-NUMBER origin/master`
4. `git -C .claude/worktrees/issue-NUMBER config user.name "tkadauke-winston[bot]"`
5. `git -C .claude/worktrees/issue-NUMBER config user.email "tkadauke-winston[bot]@users.noreply.github.com"`
6. **CRITICAL: Steps 1-5 MUST complete before launching the agent. The agent
   must NEVER touch the main worktree. If worktree creation fails, do NOT
   launch the agent — record the error and move on.**
   Launch a background Agent for each issue. In the agent prompt, instruct
   it to invoke `Skill("implement-issue", args="NUMBER \"TITLE\" BODY")`.
   The skill auto-approves Read/Write/Edit/Bash so the agent won't block
   on permissions. Launch agents in parallel when processing multiple issues.

   **Scope agents to the worktree.** Every agent prompt MUST include this
   verbatim block to prevent broad filesystem scans:
   > Skill location is `/Users/tkadauke/code/tiny_ci/.claude/skills/implement-issue/SKILL.md`
   > — read it directly, don't search for it. All file operations must be
   > absolute paths under `.claude/worktrees/issue-NUMBER/`. Do NOT run `find`,
   > `glob`, or `grep` against `/Users/tkadauke` or `~` — stay inside the
   > worktree and (when needed) `~/.github/gh-token.sh` for auth.
7. When the agent completes, extract the PR number from its output
8. `git worktree remove .claude/worktrees/issue-NUMBER`
9. Update `.trackers/issue-tracker.json` and seed `.trackers/pr-tracker.json`

### If blocked — comment

Check existing comments first: `gh issue view NUMBER --json comments`
If no bot comment exists: `gh issue comment NUMBER --repo tkadauke/tiny_ci --body "..."`
Update `.trackers/issue-tracker.json` with `status: commented`

### If not actionable — skip

Update `.trackers/issue-tracker.json` with `status: skipped`

### On error — clean up

```
git worktree remove --force .claude/worktrees/issue-NUMBER
git branch -D fix/issue-NUMBER
```
Update `.trackers/issue-tracker.json` with `status: error`

## State file format

`.trackers/issue-tracker.json`:
```json
{
  "issues": {
    "12": {
      "last_seen_at": "2026-04-27T12:00:00Z",
      "last_processed_at": "2026-04-27T12:00:00Z",
      "status": "pr_created",
      "pr_number": 14,
      "comment_id": null,
      "last_human_comment_at": "2026-04-27T11:00:00Z"
    }
  }
}
```

Save state after EACH issue (crash-safe).

## Rules
- **NO ASYNC AGENT MAY EVER TOUCH THE MAIN WORKTREE.** Always create the
  worktree BEFORE launching the agent. If worktree creation fails, FAIL —
  do not launch the agent.
- NEVER modify the main checkout — always use worktrees in .claude/worktrees/
- Only push to branches you create (fix/issue-NUMBER)
- Write tests for new functionality where the test suite supports it
  (currently only stubs — see CLAUDE.md). At minimum, do not break
  `bin/rails zeitwerk:check`.
- Follow all CLAUDE.md conventions
