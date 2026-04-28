#!/bin/bash
set -euo pipefail

REPO="tkadauke/tiny_ci"
PR_TRACKER=".trackers/pr-tracker.json"

export GH_TOKEN=$(~/.github/gh-token.sh)

echo "=== Startup Recovery ==="

# 1. Clean up stale worktrees
for wt in .claude/worktrees/pr-*; do
  [ -d "$wt" ] || continue
  echo "Removing stale worktree: $wt"
  git worktree remove --force "$wt" 2>/dev/null || true
done

# 2. Initialize tracker if missing
mkdir -p .trackers
[ -f "$PR_TRACKER" ] || echo '{"prs":{}}' > "$PR_TRACKER"

echo "=== Recovery complete ==="
