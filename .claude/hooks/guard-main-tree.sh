#!/bin/bash
# PreToolUse hook for Write/Edit/NotebookEdit.
#
# Blocks writes that land in the MAIN checkout's source tree
# (/Users/tkadauke/code/tiny_ci/...) unless the path is inside one of:
#   - .claude/        (skills, hooks, settings, worktrees)
#   - .trackers/      (issue/PR state)
#
# Subagents implementing an issue are expected to write only inside
# .claude/worktrees/issue-N/ — that's covered by the .claude/ allowlist.
# This hook prevents the failure mode seen on issue #32 where an
# agent leaked Write calls into the main checkout's source files.
#
# Hook protocol (Claude Code):
#   - stdin is JSON: { tool_name, tool_input, ... }
#   - exit 0  → allow
#   - exit 2  → block; stderr is fed back to the model

set -euo pipefail

PROJECT_ROOT="/Users/tkadauke/code/tiny_ci"

input=$(cat)
file_path=$(echo "$input" | jq -r '.tool_input.file_path // empty')

# No file_path → not a write (shouldn't happen for Write/Edit/NotebookEdit, but be safe)
if [[ -z "$file_path" ]]; then
  exit 0
fi

# Not under the project root → unrelated, allow
case "$file_path" in
  "$PROJECT_ROOT"/*) ;;
  *) exit 0 ;;
esac

# Allowlisted prefixes inside the project root
case "$file_path" in
  "$PROJECT_ROOT"/.claude/*) exit 0 ;;
  "$PROJECT_ROOT"/.trackers/*) exit 0 ;;
esac

# Anything else under the project root is the main-checkout source tree.
cat >&2 <<EOF
BLOCKED: Write/Edit into the main checkout source tree is not allowed.
  Attempted path: $file_path

If you are an implement-issue subagent, your file operations must be
absolute paths under .claude/worktrees/issue-N/ — never the bare
$PROJECT_ROOT/<source-dir>/...

If you are the orchestrator, edit via a worktree, or use git operations
(checkout/merge/rebase) rather than direct Write/Edit on the main tree.

Allowed write prefixes inside the project root:
  $PROJECT_ROOT/.claude/...   (includes worktrees, skills, hooks)
  $PROJECT_ROOT/.trackers/...
EOF
exit 2
