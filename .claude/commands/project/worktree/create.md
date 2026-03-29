# Create Worktree for Parallel Development

You are tasked with creating a Git worktree for parallel development. Your goal
is to execute the worktree creation process exactly as specified below, setting
up an isolated development environment with project-specific setup via hooks.

## Command Input

<arguments>
#$ARGUMENTS
</arguments>

Parse the arguments to extract:

- Branch name (required first argument)

## When to Use

Use this command when you need to:

- Run multiple Claude agents in parallel on different features
- Work on one feature while an agent handles another
- Prevent conflicts between concurrent development tasks
- Maintain clean separation between different work streams
- Isolate ports/services per worktree (via post-create hook)

## Required Arguments

- `branch_name` - Name for the new branch and worktree folder
  - **MUST be 63 characters or less** (Git's recommended limit)
  - Use descriptive but meaningful names
  - Examples:
    - Good: `feature/123-webhook-management-api`
    - Too long:
      `feature/123-implement-webhook-management-and-notification-system-with-retry-logic`
  - Branch name will be validated and rejected if too long

## Optional Arguments

- `-- <hook-args>` - Pass arguments to the post-create hook (standard separator)

**Example with hook arguments:**

```
/project:worktree:create #123 -- --shared --start
```

Everything after `--` is passed to your project's post-create hook as both
positional arguments (`$1`, `$2`, etc.) and the `WORKTREE_HOOK_ARGS` env var.

## Process

1. **Validate Environment**
   - Ensure we're in a Git repository
   - Check that branch name doesn't already exist
   - Verify worktrees folder structure

2. **Create Worktree Structure**
   - Get current project folder name
   - Create adjacent worktrees folder if needed: `{project-name}-worktrees/`
   - Create Git worktree:
     `git worktree add ../{project-name}-worktrees/{branch_name} -b {branch_name}`

3. **Copy Essential Files**
   - Copy all `.env*` files (includes `.env`, `.env.local`, `.env.development`,
     etc.)
   - Copy `.claude/` folder for AI settings
   - Copy `.workflow/` folder if using workflow system
   - Copy `.cursor/` folder for Cursor editor settings
   - Copy `.vscode/` folder for VS Code settings
   - Copy any other project-specific hidden folders

4. **Install Dependencies**
   - Run `pnpm install` (or yarn/npm)
   - Build workspace packages if applicable

5. **Compute Building Blocks**
   - Extract issue number from arguments (if in issue mode)
   - Compute unique offset: `(issue_number % 100) * 10`
   - Export environment variables for hooks:
     - `WORKTREE_PATH` - Full path to the new worktree
     - `WORKTREE_BRANCH` - Branch name
     - `WORKTREE_ISSUE` - Issue number (if applicable)
     - `WORKTREE_OFFSET` - Computed offset for port uniqueness

6. **Run Post-Create Hook** (if configured in `.workflow/config.json`)
   - Reads `worktree.post_create` path from config
   - Calls the configured script with env vars available
   - Hook handles project-specific setup (ports, config files, etc.)

7. **Provide Ready-to-Copy Commands**
   - Single command to navigate, open editor, and start Claude
   - Reminder to use different ports for dev servers
   - Clear next steps for starting work

## Usage Examples

### Basic Worktree

```
/project:worktree:create feature-user-auth
```

Output:

```
🌳 Creating worktree for parallel development...

✅ Created worktree: feature-user-auth
📁 Location: ../myproject-worktrees/feature-user-auth
🌿 Branch: feature-user-auth
🔢 Offset: 0 (for port uniqueness)
📦 Dependencies installed

🔌 Running post-create hook...
   Script: .claude/commands/scripts/worktree-setup.sh
   WORKTREE_OFFSET=0

   ✅ Post-create hook completed

💡 Tips:
   - Port offset 0 available for dev servers (e.g., --port 3000)
   - For git merge/pull with skip-worktree files: use worktree-git.sh wrapper
```

### Worktree from Issue

```
/project:worktree:create #123
```

Creates a worktree for issue #123 with offset 230 (`(123 % 100) * 10`). The hook
can use this offset for unique port allocation.

## Command Input

<arguments>
#$ARGUMENTS
</arguments>

## Implementation

This command delegates to a shared script that handles worktree creation for
both direct branch names and issue-based workflows.

**🚨 IF IN SANDBOX MODE: This script writes to paths outside this repo
(`../{project}-worktrees/`). Must run with `dangerouslyDisableSandbox: true`.**

```bash
bash ".claude/commands/scripts/worktree-create.sh" "$ARGUMENTS"
```

The script will:

1. Detect direct mode (branch name provided)
2. Validate branch name length (63 char max)
3. Create the git worktree
4. Copy .env files and development folders
5. Install dependencies and build workspace packages
6. Output next steps

## Configuration

### Post-Create Hook

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

**Template provided:**

Create a script at the configured path. It receives the env vars listed above
and any args passed after `--`.

**For projects without hooks configured:** No post-create script runs, and the
worktree is created with just file copying and dependency installation.

## Notes

- Worktrees are placed outside main project to avoid tooling conflicts
- Each worktree has its own Git state and can be worked on independently
- Use `WORKTREE_OFFSET` to compute unique ports for dev servers
- Merge worktree branches back to main when complete

### Port Offset Formula

- Formula: `(issue_number % 100) * 10`
- Example: issue #123 → offset 230
- Use this to compute unique ports: `54300 + offset`, `3000 + offset`, etc.
- For direct branch mode (no issue), offset is auto-assigned by scanning
  existing worktrees for the next available slot (skipping offset 20 which
  collides with main Supabase ports)

### Metadata

The `.worktree-metadata.json` file records:

- `worktree_id` - Unique identifier
- `branch_name` - Git branch
- `issue` - Issue number (if applicable)
- `offset` - Computed offset for ports
- `created_at` - Creation timestamp

Your post-create hook can extend this file with additional project-specific
data.
