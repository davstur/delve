# Git Worktree Commands for Parallel AI Development

Commands for managing Git worktrees to enable multiple AI agents working in
parallel.

## Overview

Git worktrees allow you to have multiple working directories for the same
repository, each on a different branch. This is perfect for:

- Running multiple Claude agents simultaneously
- Working on one feature while AI handles another
- Preventing merge conflicts during concurrent development
- Maintaining clean separation between different work streams

## Available Commands

### create.md

Creates a new Git worktree with proper setup for AI development.

### list.md

Lists all active Git worktrees with their status.

### status.md

Shows detailed status of all worktrees including git status and readiness.

### remove.md

Removes a worktree and optionally its branch.

## Workflow Examples

### Method 1: Issue-Driven Workflow (Recommended)

```bash
# In main directory, implement issue #123 in parallel
/project:issues:implement #123 --worktree

# Copy and run the provided command (IDE command from .workflow/config.json):
cd ../myproject-worktrees/issue-123-user-auth && $IDE_CMD . && claude

# In new Claude instance:
/project:issues:implement #123 --on-worktree
```

### Method 2: Direct Worktree Creation

```bash
# Create worktree using shell function (auto-opens editor from config)
wt feature-authentication

# Or using Claude command
/project:worktree:create feature-authentication

# Copy and run the provided command (IDE command from .workflow/config.json):
cd ../myproject-worktrees/feature-authentication && $IDE_CMD . && claude
```

> **Note**: The IDE command (e.g., `cursor`, `code`, `webstorm`) is read from
> `.workflow/config.json` under `ide.command`. Configure your preferred editor
> there.

### Managing Multiple Worktrees

```bash
# Check status of all worktrees
wts  # or /project:worktree:status

# Create PR from worktree (standard git)
gh pr create

# Or merge directly (standard git)
git checkout main && git merge feature-authentication

# Clean up
wtr feature-authentication  # or /project:worktree:remove feature-authentication
```

### Merging/Pulling in Worktrees

**Important:** Worktrees with modified config files marked as `skip-worktree`
(e.g., for port isolation) hide changes from `git status`, but `git merge`,
`git pull`, and `git rebase` will fail because these "hidden" changes would be
overwritten.

Use the wrapper script for these operations:

```bash
# Using the wrapper script directly
bash .claude/commands/scripts/worktree-git.sh merge main
bash .claude/commands/scripts/worktree-git.sh pull
bash .claude/commands/scripts/worktree-git.sh pull --rebase
bash .claude/commands/scripts/worktree-git.sh rebase main
```

Or add these shortcuts to your `package.json`:

```json
{
  "scripts": {
    "wt:merge": "bash .claude/commands/scripts/worktree-git.sh merge main",
    "wt:pull": "bash .claude/commands/scripts/worktree-git.sh pull",
    "wt:git": "bash .claude/commands/scripts/worktree-git.sh"
  }
}
```

Then use:

```bash
pnpm wt:merge              # Merge main into current branch
pnpm wt:pull               # Pull current branch
pnpm wt:git rebase main    # Any git command
```

**What the script does:**

1. Detects all files marked as `skip-worktree`
2. Backs up their current contents
3. Removes skip-worktree flag, checks out HEAD version
4. Runs the git operation
5. Restores files from backup
6. Re-marks files as skip-worktree

**Note:** Regular `git commit`, `git push`, `git status`, etc. work normally
without the wrapper. Only use it when git complains about files being
overwritten.

### Development Port Management

- Main: `npm run dev` (port 3000)
- Worktree 1: `npm run dev -- --port 3010`
- Worktree 2: `npm run dev -- --port 3020`

## Best Practices

1. **Naming Convention**: Use descriptive branch names like `feature-`, `fix-`,
   `refactor-`
2. **Port Management**: Keep a list of which ports each worktree uses
3. **Regular Cleanup**: Use `wtc` to remove merged worktrees
4. **Environment Files**: The script copies `.env` files automatically
5. **Editor Windows**: Use separate editor windows/desktops for each worktree

## Post-Create Hook

Worktree creation supports project-specific setup through a post-create hook.
Configure the hook script in `.workflow/config.json`:

```json
{
  "worktree": {
    "post_create": ".claude/commands/scripts/worktree-setup.sh"
  }
}
```

**Environment variables passed to hooks:**

| Variable                | Description                                           |
| ----------------------- | ----------------------------------------------------- |
| `WORKTREE_PATH`         | Full path to the new worktree                         |
| `WORKTREE_BRANCH`       | Branch name                                           |
| `WORKTREE_ISSUE`        | Issue number (if created from issue, else empty)      |
| `WORKTREE_OFFSET`       | Computed offset for port uniqueness: `(issue%100)*10` |
| `WORKTREE_ORIGINAL_DIR` | Path to the main repository                           |
| `WORKTREE_HOOK_ARGS`    | Additional args passed after `--` separator           |

**Passing arguments to hooks:**

Use the `--` separator (standard convention) to pass arguments to your hook:

```bash
/project:worktree:create #123 -- --shared --start
```

The hook receives:

- Positional args: `$1="--shared"`, `$2="--start"`
- Env var: `WORKTREE_HOOK_ARGS="--shared --start"`

**How to use the offset:**

The offset provides a unique number (0-990) for each worktree. Use it to compute
unique ports for your services:

```bash
# In your post-create hook:
SUPABASE_PORT=$((54300 + WORKTREE_OFFSET))  # e.g., 54530 for issue #123
APP_PORT=$((3000 + WORKTREE_OFFSET))        # e.g., 3230 for issue #123
```

**Creating a hook:**

Create a script at the path specified in your config. The script receives the
env vars above and any args passed after `--`. See the documentation for
examples of port isolation, config patching, and skip-worktree marking.

**Projects without hooks:** If no post_create hook is configured, worktree
creation only does file copying and dependency installation.

## Limitations

- Claude cannot CD out of its current directory to create worktrees
- Each worktree needs its own editor window for file watching
- Backend setup requires configuration in `.workflow/config.json`
