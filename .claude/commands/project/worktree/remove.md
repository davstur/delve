# Remove Git Worktree

Removes a Git worktree, its associated branch, and stops any running Supabase
instance associated with it.

## When to Use

Use this command to:

- Clean up completed feature worktrees
- Remove abandoned worktrees
- Free up disk space from copied codebases
- Stop and clean up isolated Supabase instances
- Maintain a tidy development environment

## Arguments

- `branch_name` (required) - Name of the worktree/branch to remove

## Optional Arguments

- `--force` - Force removal even if there are uncommitted changes
- `--keep-branch` - Keep the Git branch (only remove worktree)

## Process

1. **Validate Arguments**
   - Ensure branch_name is provided
   - Check if running from main repository (not a worktree)
   - Error if either condition is not met

2. **Validate Worktree**
   - Check if worktree exists
   - Check for uncommitted changes:
     - Run `git -C <worktree-path> status --porcelain`
     - Count uncommitted changes
   - If uncommitted changes exist and no `--force` flag:
     - Display warning with count of uncommitted changes
     - Show modified files list
     - Exit with error (use --force to override)
   - Show what will be removed

3. **Stop Supabase** (if running)
   - Check `.worktree-metadata.json` for `supabase_mode`
   - If mode is "isolated", run `supabase stop` in the worktree directory
   - This stops all Docker containers for that worktree's Supabase instance

4. **Remove Worktree**
   - Run `git worktree remove` command (with `--force` if specified)
   - Delete the worktree directory

5. **Handle Branch**
   - By default, also delete the associated branch
   - Keep branch if `--keep-branch` specified
   - Skip if branch is already merged

6. **Cleanup**
   - Run `git worktree prune` to clean references
   - Report success

## Usage Examples

```
# Remove worktree and branch (from main directory)
/project:worktree:remove feature/137-adopt-null-transform

# Output:
✅ Removed worktree: ../myproject-worktrees/feature/137-adopt-null-transform
✅ Deleted branch: feature/137-adopt-null-transform

# Remove worktree but keep branch
/project:worktree:remove feature-auth --keep-branch

# Worktree with uncommitted changes (interactive)
/project:worktree:remove feature/181-beekeeper-sync

# Output:
⚠️ Warning: Worktree has 17 uncommitted changes:
   M  src/sync/beekeeper.ts
   M  src/sync/history.ts
   A  src/sync/selective.ts
   ... (14 more files)

This worktree has 17 uncommitted changes. Are you sure you want to remove it? (yes/no): no
❌ Removal cancelled by user

# Force removal with uncommitted changes
/project:worktree:remove feature/181-beekeeper-sync --force

# Output:
⚠️ WARNING: Force removing worktree with 17 uncommitted changes!

The following changes will be permanently lost:
   M  src/sync/beekeeper.ts
   M  src/sync/history.ts
   A  src/sync/selective.ts
   ... (14 more files)

This will permanently delete all uncommitted work. Type 'DELETE' to confirm: DELETE
Are you absolutely sure? This cannot be undone. Type 'yes' to proceed: yes

✅ Force removed worktree: ../myproject-worktrees/feature/181-beekeeper-sync (17 uncommitted changes lost)
✅ Deleted branch: feature/181-beekeeper-sync
```

## Error Cases

When branch_name is not provided:

```
❌ Error: branch_name is required
   Please specify which worktree to remove:
   /project:worktree:remove <branch_name>
```

When run from inside a worktree:

```
❌ Error: This command must be run from the main repository, not from inside a worktree

   Current location: /path/to/project-worktrees/feature-branch

   Please navigate to the main repository first:
   cd /path/to/main-project

   Then run:
   /project:worktree:remove feature-branch
```

## Implementation

This command delegates to a shared script that handles worktree removal with
Supabase cleanup.

**🚨 IF IN SANDBOX MODE: This script deletes paths outside this repo
(`../{project}-worktrees/`). Must run with `dangerouslyDisableSandbox: true`.**

```bash
bash ".claude/commands/scripts/worktree-remove.sh" "$ARGUMENTS"
```

The script will:

1. Validate arguments and worktree location
2. Check for uncommitted changes
3. Stop Supabase if running (isolated mode)
4. Remove the git worktree
5. Delete the branch (unless --keep-branch)
6. Clean up git references

## Notes

- Must be run from the main repository directory
- Cannot remove the main worktree
- **Safety features:**
  - Checks for uncommitted changes before removal
  - Requires `--force` if uncommitted changes exist
  - Shows files that will be lost
- **Supabase cleanup:**
  - Reads `.worktree-metadata.json` to detect Supabase mode
  - Stops all Docker containers for isolated Supabase instances
  - No action needed for shared mode (uses main repo's Supabase)
- Automatically cleans up Git's worktree references
- Consider committing or stashing changes before removal
