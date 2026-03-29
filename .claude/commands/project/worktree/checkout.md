# Checkout Existing Worktree from Remote

Checks out an existing branch from origin into a new worktree. Use this to
continue work started on another machine.

## When to Use

- Continue work on a branch started on another computer
- Collaborate on a feature branch that exists on origin
- Resume work after the local worktree was removed

## Arguments

- `branch_name` (required) - Name of the existing remote branch to checkout

## Optional Arguments

- `-- <hook-args>` - Pass arguments to the post-create hook

## Process

1. Verify branch exists on origin (error if not found)
2. Fetch the branch from origin
3. Create worktree with local tracking branch
4. Run standard setup (copy .env files, install dependencies, run hooks)

See `/project:worktree:create` for details on the setup process.

## Usage Examples

```
# Checkout existing branch to continue work from another machine
/project:worktree:checkout feature/123-webhook-api

# Output:
🌳 Checking out existing worktree from origin...

📋 Direct mode: using branch name 'feature/123-webhook-api'
   Branch: feature/123-webhook-api

📁 Creating worktree...
   Location: ../myproject-worktrees/feature/123-webhook-api
   🔄 Fetching branch from origin...
   ✅ Worktree created

... (standard setup continues)

✅ Checked out worktree from origin: feature/123-webhook-api
```

## Error Cases

When branch doesn't exist on origin:

```
❌ Branch 'feature/nonexistent' not found on origin

   Available remote branches matching pattern:
   refs/heads/feature/123-webhook-api
   refs/heads/feature/456-user-auth
```

## Implementation

Uses the same script as create with `--checkout` flag:

```bash
bash ".claude/commands/scripts/worktree-create.sh" "$ARGUMENTS --checkout"
```

## Notes

- The branch must already exist on origin
- Local tracking branch is created automatically
- All standard worktree setup runs (env files, dependencies, hooks)
- Use `/project:worktree:create` to start a new branch
