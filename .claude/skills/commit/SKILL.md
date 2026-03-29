---
name: commit
description:
  Use this skill when committing code, staging files for commit, running
  "git commit", creating a commit, or when the user says "commit", "commit this",
  "commit the changes", "stage and commit", "ready to commit". Auto-triggers on
  any commit-related work to ensure the safe commit workflow is followed.
user-invocable: true
---

# Safe Commit Workflow

When sandbox mode is enabled, pre-commit hooks (lint-staged) can fail if they
try to revert files the sandbox protects — like `.claude/settings.json`. This
skill provides a safe commit workflow that works reliably in sandboxed
environments.

## Steps

### 1. Quality Checks

Run the project's quality checks as **separate commands** before any git
operations. Skip only if the user explicitly says they already ran them this
session.

Read `.workflow/config.json` to determine the project's package manager, then
run:

```bash
<packageManager> typecheck
<packageManager> lint
```

If either fails: fix the issues first, then restart.

### 2. Review Changes

```bash
git status
git diff
git diff --cached
```

Present a summary of staged and unstaged changes. Never stage files
automatically.

### 3. Stage Specific Files

**Never `git add -A` or `git add .`** — these can include secrets, env files,
or unrelated changes from parallel worktrees.

```bash
git add <file1> <file2> ...
```

Ask the user which files to stage if not obvious from context.

**Never stage `.claude/` files alongside non-`.claude/` files.** The pre-commit
hook enforces this:

- **`.claude/` mixed with other files:** hook blocks the commit (lint-staged's
  stash/restore cycle can't write to sandbox-protected `.claude/` paths)
- **Only `.claude/` files:** hook skips lint-staged and allows it through
- If accidentally staged: `git reset HEAD .claude/`

### 4. Draft Commit Message

- Check recent `git log` for the repo's message style
- Draft a concise message (1-2 sentences) focused on "why" not "what"
- **Never commit without explicit user approval**

### 5. Commit (Separate Call)

Never chain `git add` and `git commit` in a single Bash call — chained commands
can bypass permission matching.

Use the Write tool for the commit message (sandbox blocks heredocs):

1. Write message to `/tmp/claude/commit-msg.txt`
2. `git commit --file /tmp/claude/commit-msg.txt`
3. `rm /tmp/claude/commit-msg.txt`

The message must end with:

```
Co-Authored-By: Claude <current-model> <noreply@anthropic.com>
```

### 6. If Pre-commit Hooks Fail

- **Never drop lint-staged stashes** (`git stash drop`) — these are data
  recovery safety nets. Leave them for the user.
- **Never use `--no-verify`** to bypass hooks.
- Check if the failure is a **timeout** (SIGKILL) vs an actual error. Monorepo
  typechecks can take >5 minutes — increase the Bash timeout before blaming
  sandbox.
- If hooks genuinely can't pass, explain the failure and let the user commit
  from their terminal.

### 7. Verify

```bash
git status
git log -1 --oneline
```
