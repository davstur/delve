#!/bin/bash
set -e

# -----------------------------------------------------------------------------
# PARSE ARGUMENTS
# -----------------------------------------------------------------------------

BRANCH_NAME=""
FORCE="false"
KEEP_BRANCH="false"
OLD_DAYS=""
DRY_RUN="false"

ARGS="$*"
while [[ -n "$ARGS" ]]; do
  case "$ARGS" in
    --force*)
      FORCE="true"
      ARGS="${ARGS#--force}"
      ARGS="${ARGS# }"
      ;;
    --keep-branch*)
      KEEP_BRANCH="true"
      ARGS="${ARGS#--keep-branch}"
      ARGS="${ARGS# }"
      ;;
    --dry-run*)
      DRY_RUN="true"
      ARGS="${ARGS#--dry-run}"
      ARGS="${ARGS# }"
      ;;
    --old*)
      ARGS="${ARGS#--old}"
      ARGS="${ARGS# }"
      # Check if next part is a number
      NEXT_WORD="${ARGS%% *}"
      if [[ "$NEXT_WORD" =~ ^[0-9]+$ ]]; then
        OLD_DAYS="$NEXT_WORD"
        [[ "$ARGS" == "$NEXT_WORD" ]] && ARGS="" || ARGS="${ARGS#* }"
      else
        OLD_DAYS="30"  # Default to 30 days
      fi
      ;;
    -*)
      # Skip unknown flags
      ARGS="${ARGS#* }"
      [[ "$ARGS" == "${ARGS%% *}" ]] && ARGS=""
      ;;
    *)
      # First non-flag argument is branch name
      WORD="${ARGS%% *}"
      if [[ -n "$WORD" ]] && [[ -z "$BRANCH_NAME" ]]; then
        BRANCH_NAME="$WORD"
      fi
      [[ "$ARGS" == "$WORD" ]] && ARGS="" || ARGS="${ARGS#* }"
      ;;
  esac
done

# -----------------------------------------------------------------------------
# COMMON VALIDATION
# -----------------------------------------------------------------------------

# Check if we're in a git repo
if ! git rev-parse --git-dir > /dev/null 2>&1; then
  echo "❌ Not in a git repository"
  exit 1
fi

# Check if we're in the main repo or a worktree
GIT_DIR=$(git rev-parse --git-dir)
if [[ "$GIT_DIR" == *".git/worktrees/"* ]]; then
  MAIN_REPO=$(git rev-parse --show-superproject-working-tree 2>/dev/null || echo "")
  echo "❌ Error: This command must be run from the main repository, not from inside a worktree"
  echo ""
  echo "   Current location: $(pwd)"
  echo ""
  if [[ -n "$MAIN_REPO" ]]; then
    echo "   Please navigate to the main repository first:"
    echo "   cd $MAIN_REPO"
  else
    echo "   Please navigate to the main repository first."
  fi
  exit 1
fi

PROJECT_NAME=$(basename "$PWD")
WORKTREE_DIR="../${PROJECT_NAME}-worktrees"

# -----------------------------------------------------------------------------
# OLD WORKTREES MODE
# -----------------------------------------------------------------------------

if [[ -n "$OLD_DAYS" ]]; then
  echo "🔍 Scanning for worktrees older than $OLD_DAYS days..."
  echo ""

  CUTOFF_DATE=$(date -v-${OLD_DAYS}d +%Y-%m-%d 2>/dev/null || date -d "$OLD_DAYS days ago" +%Y-%m-%d)
  CUTOFF_EPOCH=$(date -j -f "%Y-%m-%d" "$CUTOFF_DATE" +%s 2>/dev/null || date -d "$CUTOFF_DATE" +%s)

  OLD_WORKTREES=()
  SKIPPED_DIRTY=()

  # Get all worktrees except the main one
  while IFS= read -r line; do
    WT_PATH=$(echo "$line" | awk '{print $1}')

    # Skip the main repo
    if [[ "$WT_PATH" == "$PWD" ]]; then
      continue
    fi

    # Skip if not in our worktrees directory
    if [[ "$WT_PATH" != *"-worktrees/"* ]]; then
      continue
    fi

    # Get last commit date
    LAST_COMMIT=$(git -C "$WT_PATH" log -1 --format="%ci" 2>/dev/null | cut -d' ' -f1)
    if [[ -z "$LAST_COMMIT" ]]; then
      continue
    fi

    COMMIT_EPOCH=$(date -j -f "%Y-%m-%d" "$LAST_COMMIT" +%s 2>/dev/null || date -d "$LAST_COMMIT" +%s)

    if [[ "$COMMIT_EPOCH" -lt "$CUTOFF_EPOCH" ]]; then
      # Check for uncommitted changes (ignoring package.json and lockfile drift)
      UNCOMMITTED=$(git -C "$WT_PATH" status --porcelain -uno 2>/dev/null | grep -v -E "(package\.json|pnpm-lock\.yaml|package-lock\.json|yarn\.lock)$" | wc -l | tr -d ' ')
      BRANCH=$(git -C "$WT_PATH" rev-parse --abbrev-ref HEAD 2>/dev/null)

      # Extract just the worktree folder name for display
      WT_NAME=$(echo "$WT_PATH" | sed "s|.*/||")

      if [[ "$UNCOMMITTED" -gt 0 ]] && [[ "$FORCE" != "true" ]] && [[ "$DRY_RUN" != "true" ]]; then
        SKIPPED_DIRTY+=("$WT_NAME ($LAST_COMMIT) - $UNCOMMITTED uncommitted changes")
      else
        OLD_WORKTREES+=("$WT_PATH|$WT_NAME|$LAST_COMMIT|$BRANCH|$UNCOMMITTED")
      fi
    fi
  done < <(git worktree list)

  if [[ ${#OLD_WORKTREES[@]} -eq 0 ]]; then
    echo "✅ No old worktrees found (older than $OLD_DAYS days)"
    if [[ ${#SKIPPED_DIRTY[@]} -gt 0 ]]; then
      echo ""
      echo "⚠️  Skipped ${#SKIPPED_DIRTY[@]} worktrees with uncommitted changes:"
      for item in "${SKIPPED_DIRTY[@]}"; do
        echo "   - $item"
      done
      echo ""
      echo "   Use --force to include these"
    fi
    exit 0
  fi

  echo "Found ${#OLD_WORKTREES[@]} old worktrees:"
  echo ""
  printf "%-60s %-12s %s\n" "WORKTREE" "LAST COMMIT" "BRANCH"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  for item in "${OLD_WORKTREES[@]}"; do
    IFS='|' read -r WT_PATH WT_NAME LAST_COMMIT BRANCH UNCOMMITTED <<< "$item"
    DIRTY_MARKER=""
    if [[ "$UNCOMMITTED" -gt 0 ]]; then
      DIRTY_MARKER=" ⚠️"
    fi
    printf "%-60s %-12s %s%s\n" "$WT_NAME" "$LAST_COMMIT" "$BRANCH" "$DIRTY_MARKER"
  done

  if [[ ${#SKIPPED_DIRTY[@]} -gt 0 ]]; then
    echo ""
    echo "⚠️  Skipped ${#SKIPPED_DIRTY[@]} worktrees with uncommitted changes (use --force to include)"
  fi

  if [[ "$DRY_RUN" == "true" ]]; then
    echo ""
    # Count how many have uncommitted changes
    DIRTY_COUNT=0
    CLEAN_COUNT=0
    for item in "${OLD_WORKTREES[@]}"; do
      IFS='|' read -r _ _ _ _ UNCOMMITTED <<< "$item"
      if [[ "$UNCOMMITTED" -gt 0 ]]; then
        ((DIRTY_COUNT++)) || true
      else
        ((CLEAN_COUNT++)) || true
      fi
    done

    echo "ℹ️  Dry run summary:"
    if [[ "$FORCE" == "true" ]]; then
      echo "   Would remove: ${#OLD_WORKTREES[@]} worktrees ($DIRTY_COUNT with uncommitted changes)"
    else
      echo "   Would remove: $CLEAN_COUNT clean worktrees"
      if [[ "$DIRTY_COUNT" -gt 0 ]]; then
        echo "   Would skip: $DIRTY_COUNT worktrees with uncommitted changes (use --force to include)"
      fi
    fi
    exit 0
  fi

  # Count what will actually be removed
  WILL_REMOVE=0
  WILL_SKIP=0
  for item in "${OLD_WORKTREES[@]}"; do
    IFS='|' read -r _ _ _ _ UNCOMMITTED <<< "$item"
    if [[ "$UNCOMMITTED" -gt 0 ]] && [[ "$FORCE" != "true" ]]; then
      ((WILL_SKIP++)) || true
    else
      ((WILL_REMOVE++)) || true
    fi
  done

  if [[ "$WILL_REMOVE" -eq 0 ]]; then
    echo ""
    echo "⚠️  No worktrees to remove (all $WILL_SKIP have uncommitted changes)"
    echo "   Use --force to remove them anyway"
    exit 0
  fi

  echo ""
  if [[ "$WILL_SKIP" -gt 0 ]]; then
    echo "This will remove $WILL_REMOVE worktrees and their branches."
    echo "($WILL_SKIP worktrees with uncommitted changes will be skipped)"
  else
    echo "This will remove $WILL_REMOVE worktrees and their branches."
  fi
  echo ""
  read -p "Proceed? [y/N] " -n 1 -r
  echo ""

  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 0
  fi

  echo ""
  REMOVED_COUNT=0
  SKIPPED_COUNT=0
  FAILED_COUNT=0

  for item in "${OLD_WORKTREES[@]}"; do
    IFS='|' read -r WT_PATH WT_NAME LAST_COMMIT BRANCH UNCOMMITTED <<< "$item"

    # Skip dirty worktrees unless --force
    if [[ "$UNCOMMITTED" -gt 0 ]] && [[ "$FORCE" != "true" ]]; then
      echo "⏭️  Skipping: $WT_NAME ($UNCOMMITTED uncommitted changes)"
      ((SKIPPED_COUNT++)) || true
      continue
    fi

    echo "🗑️  Removing: $WT_NAME"

    # Check for isolated Supabase
    SUPABASE_MODE="none"
    if [ -f "$WT_PATH/.worktree-metadata.json" ]; then
      SUPABASE_MODE=$(grep -o '"supabase_mode": *"[^"]*"' "$WT_PATH/.worktree-metadata.json" | cut -d'"' -f4 || echo "none")
    fi

    if [ "$SUPABASE_MODE" = "isolated" ]; then
      # Clean up Docker resources
      if command -v supabase >/dev/null 2>&1; then
        (cd "$WT_PATH" && supabase stop --no-backup 2>/dev/null || true)
      fi

      # Extract worktree identifier for Docker cleanup
      WT_ID=$(basename "$WT_PATH")
      DOCKER_PREFIX="${PROJECT_NAME}-${WT_ID}"

      # Remove orphaned containers and volumes (portable pattern for macOS)
      ORPHAN_CONTAINERS=$(docker ps -aq --filter "name=${DOCKER_PREFIX}" 2>/dev/null || true)
      [ -n "$ORPHAN_CONTAINERS" ] && docker rm -f $ORPHAN_CONTAINERS 2>/dev/null || true
      ORPHAN_VOLUMES=$(docker volume ls -q --filter "name=${DOCKER_PREFIX}" 2>/dev/null || true)
      [ -n "$ORPHAN_VOLUMES" ] && docker volume rm $ORPHAN_VOLUMES 2>/dev/null || true
    fi

    # Remove worktree
    if git worktree remove "$WT_PATH" --force 2>/dev/null; then
      # Delete branch
      if [[ "$KEEP_BRANCH" != "true" ]]; then
        git branch -D "$BRANCH" 2>/dev/null || true
      fi
      echo "   ✅ Removed"
      ((REMOVED_COUNT++)) || true
    else
      echo "   ❌ Failed"
      ((FAILED_COUNT++)) || true
    fi
  done

  # Prune worktree references
  git worktree prune

  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "✅ Cleanup complete"
  echo "   Removed: $REMOVED_COUNT worktrees"
  if [[ "$SKIPPED_COUNT" -gt 0 ]]; then
    echo "   Skipped: $SKIPPED_COUNT worktrees (uncommitted changes)"
  fi
  if [[ "$FAILED_COUNT" -gt 0 ]]; then
    echo "   Failed: $FAILED_COUNT worktrees"
  fi
  echo ""
  exit 0
fi

# -----------------------------------------------------------------------------
# SINGLE WORKTREE MODE
# -----------------------------------------------------------------------------

echo "🗑️  Removing worktree..."
echo ""

if [[ -z "$BRANCH_NAME" ]]; then
  echo "❌ Error: branch_name is required"
  echo ""
  echo "   Usage:"
  echo "   /project:worktree:remove <branch_name>        Remove a specific worktree"
  echo "   /project:worktree:remove --old [days]         Remove worktrees older than N days (default: 30)"
  echo ""
  echo "   Options:"
  echo "   --force        Force remove even with uncommitted changes"
  echo "   --keep-branch  Don't delete the branch after removing worktree"
  echo "   --dry-run      Show what would be removed (with --old)"
  exit 1
fi

WORKTREE_PATH="$WORKTREE_DIR/$BRANCH_NAME"

if [ ! -d "$WORKTREE_PATH" ]; then
  echo "❌ Worktree not found: $WORKTREE_PATH"
  echo ""
  echo "Available worktrees:"
  git worktree list
  exit 1
fi

echo "📁 Found worktree: $WORKTREE_PATH"

# -----------------------------------------------------------------------------
# CHECK FOR UNCOMMITTED CHANGES
# -----------------------------------------------------------------------------

UNCOMMITTED_COUNT=0
if [ -d "$WORKTREE_PATH/.git" ] || [ -f "$WORKTREE_PATH/.git" ]; then
  # Ignore package.json and lockfile drift by default
  UNCOMMITTED_COUNT=$(git -C "$WORKTREE_PATH" status --porcelain -uno 2>/dev/null | grep -v -E "(package\.json|pnpm-lock\.yaml|package-lock\.json|yarn\.lock)$" | wc -l | tr -d ' ')
fi

if [ "$UNCOMMITTED_COUNT" -gt 0 ] && [ "$FORCE" != "true" ]; then
  echo ""
  echo "⚠️  Warning: Worktree has $UNCOMMITTED_COUNT uncommitted changes:"
  git -C "$WORKTREE_PATH" status --porcelain -uno | grep -v -E "(package\.json|pnpm-lock\.yaml|package-lock\.json|yarn\.lock)$" | head -10
  if [ "$UNCOMMITTED_COUNT" -gt 10 ]; then
    echo "   ... ($((UNCOMMITTED_COUNT - 10)) more files)"
  fi
  echo ""
  echo "Use --force to remove anyway (changes will be lost)"
  exit 1
fi

if [ "$UNCOMMITTED_COUNT" -gt 0 ] && [ "$FORCE" = "true" ]; then
  echo ""
  echo "⚠️  WARNING: Force removing worktree with $UNCOMMITTED_COUNT uncommitted changes!"
  echo ""
  echo "The following changes will be permanently lost:"
  git -C "$WORKTREE_PATH" status --porcelain -uno | grep -v -E "(package\.json|pnpm-lock\.yaml|package-lock\.json|yarn\.lock)$" | head -10
  if [ "$UNCOMMITTED_COUNT" -gt 10 ]; then
    echo "   ... ($((UNCOMMITTED_COUNT - 10)) more files)"
  fi
fi

# -----------------------------------------------------------------------------
# STOP SUPABASE (if running)
# -----------------------------------------------------------------------------

echo ""
echo "🗄️  Checking for running Supabase..."

# Check if there's a .worktree-metadata.json indicating Supabase mode
SUPABASE_MODE="none"
if [ -f "$WORKTREE_PATH/.worktree-metadata.json" ]; then
  SUPABASE_MODE=$(grep -o '"supabase_mode": *"[^"]*"' "$WORKTREE_PATH/.worktree-metadata.json" | cut -d'"' -f4 || echo "none")
fi

if [ "$SUPABASE_MODE" = "isolated" ]; then
  echo "   Worktree has isolated Supabase configuration"

  # Try to stop Supabase and remove all data
  if command -v supabase >/dev/null 2>&1; then
    (
      cd "$WORKTREE_PATH"
      # Check if supabase is running by looking for containers
      if supabase status >/dev/null 2>&1; then
        echo "   Stopping Supabase and removing data..."
        supabase stop --no-backup || echo "   ⚠️  Could not stop Supabase (may not have been running)"
        echo "   ✅ Supabase stopped and data removed"
      else
        echo "   ℹ️  Supabase was not running"
        # Still try to clean up any orphaned volumes
        supabase stop --no-backup 2>/dev/null || true
      fi
    )
  else
    echo "   ⚠️  Supabase CLI not found, skipping stop"
  fi

  # Clean up any orphaned Docker resources for this worktree
  DOCKER_PREFIX="${PROJECT_NAME}-${BRANCH_NAME}"
  DOCKER_PREFIX_ALT="${PROJECT_NAME}_${BRANCH_NAME}"

  # Remove any containers that might have been missed
  ORPHAN_CONTAINERS=$(docker ps -aq --filter "name=${DOCKER_PREFIX}" --filter "name=${DOCKER_PREFIX_ALT}" 2>/dev/null || true)
  if [ -n "$ORPHAN_CONTAINERS" ]; then
    echo "   Removing orphaned containers..."
    docker rm -f $ORPHAN_CONTAINERS 2>/dev/null || true
  fi

  # Remove any volumes that might have been missed
  ORPHAN_VOLUMES=$(docker volume ls -q --filter "name=${DOCKER_PREFIX}" --filter "name=${DOCKER_PREFIX_ALT}" 2>/dev/null || true)
  if [ -n "$ORPHAN_VOLUMES" ]; then
    echo "   Removing orphaned volumes..."
    docker volume rm $ORPHAN_VOLUMES 2>/dev/null || true
  fi

  echo "   ✅ Docker cleanup complete"
else
  echo "   ℹ️  No isolated Supabase to stop (mode: $SUPABASE_MODE)"
fi

# -----------------------------------------------------------------------------
# REMOVE WORKTREE
# -----------------------------------------------------------------------------

echo ""
echo "🗑️  Removing worktree..."

if [ "$FORCE" = "true" ]; then
  git worktree remove "$WORKTREE_PATH" --force
else
  git worktree remove "$WORKTREE_PATH"
fi

echo "   ✅ Removed worktree: $WORKTREE_PATH"

# -----------------------------------------------------------------------------
# HANDLE BRANCH
# -----------------------------------------------------------------------------

if [ "$KEEP_BRANCH" != "true" ]; then
  # Check if branch exists
  if git show-ref --verify --quiet "refs/heads/$BRANCH_NAME"; then
    # Check if branch is merged to main/master
    DEFAULT_BRANCH=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@' || echo "main")

    if git branch --merged "$DEFAULT_BRANCH" | grep -q "^\s*$BRANCH_NAME$"; then
      echo "   ✅ Branch $BRANCH_NAME is already merged to $DEFAULT_BRANCH"
    fi

    # Delete the branch
    git branch -D "$BRANCH_NAME" 2>/dev/null && echo "   ✅ Deleted branch: $BRANCH_NAME" || echo "   ⚠️  Could not delete branch: $BRANCH_NAME"
  else
    echo "   ℹ️  Branch $BRANCH_NAME does not exist locally"
  fi
else
  echo "   ℹ️  Keeping branch: $BRANCH_NAME (--keep-branch)"
fi

# -----------------------------------------------------------------------------
# CLEANUP
# -----------------------------------------------------------------------------

echo ""
echo "🧹 Cleaning up..."
git worktree prune
echo "   ✅ Pruned worktree references"

# -----------------------------------------------------------------------------
# OUTPUT SUMMARY
# -----------------------------------------------------------------------------

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Worktree removed successfully"
echo ""
if [ "$UNCOMMITTED_COUNT" -gt 0 ]; then
  echo "   ⚠️  $UNCOMMITTED_COUNT uncommitted changes were lost"
fi
if [ "$KEEP_BRANCH" != "true" ]; then
  echo "   🌿 Branch deleted: $BRANCH_NAME"
else
  echo "   🌿 Branch kept: $BRANCH_NAME"
fi
if [ "$SUPABASE_MODE" = "isolated" ]; then
  echo "   🗄️  Supabase containers stopped"
fi
echo ""
