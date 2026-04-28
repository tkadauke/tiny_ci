#!/bin/bash
set -euo pipefail

REPO="tkadauke/tiny_ci"
TRACKER=".trackers/issue-tracker.json"
PR_TRACKER=".trackers/pr-tracker.json"

export GH_TOKEN=$(~/.github/gh-token.sh)

echo "=== Startup Recovery ==="

# 1. Clean up stale worktrees
for wt in .claude/worktrees/issue-*; do
  [ -d "$wt" ] || continue
  echo "Removing stale worktree: $wt"
  git worktree remove --force "$wt" 2>/dev/null || true
done

# 2. Clean up stale local branches with no open PR
for b in $(git branch | grep "fix/issue-" | sed 's/^..//'); do
  pr=$(gh pr list --repo "$REPO" --head "$b" --json number -q '.[0].number' 2>/dev/null || true)
  if [ -z "$pr" ]; then
    echo "Deleting stale branch: $b"
    git branch -D "$b" 2>/dev/null || true
  fi
done

# 3. Initialize tracker if missing
mkdir -p .trackers
[ -f "$TRACKER" ] || echo '{"issues":{}}' > "$TRACKER"
[ -f "$PR_TRACKER" ] || echo '{"prs":{}}' > "$PR_TRACKER"

echo "=== Recovery complete ==="
