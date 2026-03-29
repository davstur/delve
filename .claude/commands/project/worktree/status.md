# Worktree Status

Shows the status of all worktrees and their readiness for merging.

## When to Use

Use this command to:

- Get an overview of all active worktrees
- Check which worktrees have uncommitted changes
- See which are ready to merge
- Monitor parallel development progress

## Process

1. **List All Worktrees**
   - Show all worktrees with their branches
   - Display file paths

2. **Check Each Worktree**
   - Git status (clean/modified/ahead/behind)
   - Number of commits ahead of main
   - Last commit message and date
   - Any uncommitted changes

3. **Merge Readiness**
   - ✅ Ready to merge (clean, commits ahead)
   - ⚠️ Has uncommitted changes
   - 🔄 Behind main (needs rebase/merge)
   - ✓ Already merged (can be removed)

4. **Development Activity**
   - Show if Claude is running in worktree
   - Display any running dev servers
   - Port usage information

## Usage Example

```
/project:worktree:status
```

Output example:

```
Worktree Status:

1. feature-auth [../myproject-worktrees/feature-auth]
   Branch: feature-auth
   Status: ✅ Ready to merge (3 commits ahead)
   Last commit: "feat: add JWT authentication" (2 hours ago)
   Claude: Not running

2. fix-navigation [../myproject-worktrees/fix-navigation]
   Branch: fix-navigation
   Status: ⚠️  Uncommitted changes (2 files)
   Last commit: "fix: mobile menu toggle" (30 min ago)
   Claude: Running (PID: 12345)
   Dev server: Port 3001

3. refactor-api [../myproject-worktrees/refactor-api]
   Branch: refactor-api
   Status: ✓ Already merged to main
   Can be removed with: wtr refactor-api

Summary: 3 worktrees (1 ready, 1 in progress, 1 completed)
```

## Notes

- Provides actionable next steps for each worktree
- Helps coordinate multiple parallel efforts
- Identifies cleanup opportunities
