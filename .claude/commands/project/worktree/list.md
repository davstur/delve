# List Git Worktrees

Lists all active Git worktrees for the current repository.

## When to Use

Use this command to:

- See all active worktrees and their branches
- Check which features are being worked on in parallel
- Identify worktrees that can be cleaned up
- Verify worktree locations

## Process

1. **List Worktrees**
   - Run `git worktree list --porcelain` for reliable parsing
   - Display branch names and paths

2. **Check Status**
   - For each worktree, show if it has uncommitted changes
   - Indicate if branch has been merged to main

3. **Provide Summary**
   - Total number of active worktrees
   - Suggestions for cleanup if applicable

## Implementation

```bash
#!/bin/bash

# List all Git worktrees with detailed status
echo "🌳 Git Worktrees"
echo "==============="
echo ""

# Track totals
total_count=0
merged_count=0
modified_count=0
prunable_count=0

# Store current directory to return later
ORIGINAL_DIR="$(pwd)"

# Parse worktrees using porcelain format for reliable parsing
while IFS= read -r line; do
    if [[ "$line" == worktree* ]]; then
        # Extract worktree path
        WORKTREE_PATH="${line#worktree }"

        # Read the next lines for HEAD and branch info
        read -r head_line
        read -r branch_line

        # Extract commit hash
        COMMIT="${head_line#HEAD }"
        COMMIT="${COMMIT:0:7}"  # Short hash

        # Extract branch name
        if [[ "$branch_line" == branch* ]]; then
            BRANCH="${branch_line#branch refs/heads/}"
        elif [[ "$branch_line" == detached* ]]; then
            BRANCH="(detached HEAD)"
        else
            BRANCH="(no branch)"
        fi

        # Skip the bare line if present
        read -r maybe_bare
        if [[ "$maybe_bare" != worktree* ]] && [[ -n "$maybe_bare" ]]; then
            # This was bare or prunable, continue to next
            if [[ "$maybe_bare" == prunable* ]]; then
                ((prunable_count++))
            fi
            continue
        else
            # Put it back if it was the start of next worktree
            if [[ "$maybe_bare" == worktree* ]]; then
                # We'll process this in the next iteration
                echo "$maybe_bare"
            fi
        fi

        ((total_count++))

        # Determine status
        STATUS=""
        if [[ "$WORKTREE_PATH" == "$ORIGINAL_DIR" ]]; then
            STATUS="📍 Current"
        elif [[ -d "$WORKTREE_PATH" ]]; then
            # Check for uncommitted changes
            cd "$WORKTREE_PATH" 2>/dev/null
            if [[ $? -eq 0 ]]; then
                if [[ -n $(git status --porcelain 2>/dev/null) ]]; then
                    STATUS="⚠️  Modified"
                    ((modified_count++))
                else
                    # Check if merged to main
                    if [[ "$BRANCH" != "main" ]] && [[ "$BRANCH" != "(detached HEAD)" ]]; then
                        if git merge-base --is-ancestor HEAD main 2>/dev/null; then
                            STATUS="✅ Merged to main"
                            ((merged_count++))
                        else
                            # Check commits ahead
                            ahead_count=$(git rev-list --count main..HEAD 2>/dev/null || echo "0")
                            if [[ "$ahead_count" -gt 0 ]]; then
                                STATUS="📝 ${ahead_count} commits ahead"
                            else
                                STATUS="✨ Clean"
                            fi
                        fi
                    else
                        STATUS="✨ Clean"
                    fi
                fi
                cd "$ORIGINAL_DIR" >/dev/null 2>&1
            else
                STATUS="❌ Cannot access"
            fi
        else
            STATUS="❌ Directory missing"
            ((prunable_count++))
        fi

        # Display worktree info
        echo "📁 ${BRANCH}"
        echo "   Path: ${WORKTREE_PATH}"
        echo "   Commit: ${COMMIT}"
        echo "   Status: ${STATUS}"
        echo ""
    fi
done < <(git worktree list --porcelain)

# Return to original directory
cd "$ORIGINAL_DIR" >/dev/null 2>&1

# Summary
echo "------------------------"
echo "📊 Summary:"
echo "   Total worktrees: ${total_count}"

if [[ $modified_count -gt 0 ]]; then
    echo "   ⚠️  Modified: ${modified_count}"
fi

if [[ $merged_count -gt 0 ]]; then
    echo "   ✅ Merged to main: ${merged_count} (can be removed)"
fi

if [[ $prunable_count -gt 0 ]]; then
    echo "   ❌ Prunable: ${prunable_count}"
    echo ""
    echo "💡 Run 'git worktree prune' to clean up stale references"
fi

# Helpful tips
if [[ $merged_count -gt 0 ]]; then
    echo ""
    echo "💡 To remove merged worktrees:"
    echo "   git worktree remove <path>"
fi
```

## Usage Example

```
/project:worktree:list
```

Output example:

```
🌳 Git Worktrees
===============

📁 main
   Path: /Users/you/myproject
   Commit: abc1234
   Status: 📍 Current

📁 feature/auth-system
   Path: /Users/you/myproject-worktrees/feature/auth-system
   Commit: def5678
   Status: ⚠️  Modified

📁 fix/bug-123
   Path: /Users/you/myproject-worktrees/fix/bug-123
   Commit: ghi9012
   Status: ✅ Merged to main

📁 feature/new-api
   Path: /Users/you/myproject-worktrees/feature/new-api
   Commit: jkl3456
   Status: 📝 3 commits ahead

------------------------
📊 Summary:
   Total worktrees: 4
   ⚠️  Modified: 1
   ✅ Merged to main: 1 (can be removed)

💡 To remove merged worktrees:
   git worktree remove <path>
```
