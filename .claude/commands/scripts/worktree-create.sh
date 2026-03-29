#!/bin/bash
set -e

if [[ "$1" == *"--checkout"* ]]; then
  echo "🌳 Checking out existing worktree from origin..."
else
  echo "🌳 Creating worktree for parallel development..."
fi
echo ""

# -----------------------------------------------------------------------------
# PARSE ARGUMENTS
# -----------------------------------------------------------------------------

ISSUE_NUMBERS=""
BRANCH_NAME=""
CONTEXT_VALUE=""
ORIGINAL_ARGS="$1"
MODE=""  # "issue" or "direct"
HOOK_ARGS=""  # Arguments to pass to post-create hook (after --)
CHECKOUT_MODE="false"  # Whether to checkout existing remote branch

# Split arguments at -- separator (standard convention for passing args to sub-commands)
# Everything before -- is for this script, everything after is for the hook
if [[ "$1" == *" -- "* ]]; then
  WORKFLOW_ARGS="${1%% -- *}"
  HOOK_ARGS="${1#* -- }"
elif [[ "$1" == "-- "* ]]; then
  WORKFLOW_ARGS=""
  HOOK_ARGS="${1#-- }"
elif [[ "$1" == *" --" ]]; then
  WORKFLOW_ARGS="${1% --}"
  HOOK_ARGS=""
else
  WORKFLOW_ARGS="$1"
  HOOK_ARGS=""
fi

# Parse the workflow arguments string
ARGS="$WORKFLOW_ARGS"
while [[ -n "$ARGS" ]]; do
  case "$ARGS" in
    \#[0-9]*)
      # Extract issue number (handles #123 format) → issue mode
      MODE="issue"
      NUM="${ARGS#\#}"
      NUM="${NUM%% *}"
      ISSUE_NUMBERS="$ISSUE_NUMBERS $NUM"
      [[ "$ARGS" == "#$NUM" ]] && ARGS="" || ARGS="${ARGS#*[0-9] }"
      ARGS="${ARGS# }"
      ;;
    --context\ *)
      ARGS="${ARGS#--context }"
      # Handle quoted context value
      if [[ "$ARGS" == \"* ]]; then
        ARGS="${ARGS#\"}"
        CONTEXT_VALUE="${ARGS%%\"*}"
        ARGS="${ARGS#*\"}"
      else
        CONTEXT_VALUE="${ARGS%% *}"
        [[ "$ARGS" == "$CONTEXT_VALUE" ]] && ARGS="" || ARGS="${ARGS#* }"
      fi
      ARGS="${ARGS# }"
      ;;
    --worktree*)
      # Skip this flag (we're already creating a worktree)
      ARGS="${ARGS#--worktree}"
      ARGS="${ARGS# }"
      ;;
    --on-worktree*)
      # Skip this flag
      ARGS="${ARGS#--on-worktree}"
      ARGS="${ARGS# }"
      ;;
    --checkout*)
      # Checkout existing remote branch instead of creating new
      CHECKOUT_MODE="true"
      ARGS="${ARGS#--checkout}"
      ARGS="${ARGS# }"
      ;;
    -*)
      # Skip unknown flags
      ARGS="${ARGS#* }"
      [[ "$ARGS" == "${ARGS%% *}" ]] && ARGS=""
      ;;
    *)
      # Not a flag and not an issue number - could be direct branch name
      WORD="${ARGS%% *}"
      if [[ -n "$WORD" ]] && [[ -z "$MODE" ]] && [[ -z "$BRANCH_NAME" ]]; then
        # First non-flag, non-issue argument is branch name (direct mode)
        # But only if it's not purely numeric (which would be an issue without #)
        if [[ ! "$WORD" =~ ^[0-9]+$ ]]; then
          MODE="direct"
          BRANCH_NAME="$WORD"
        fi
      fi
      [[ "$ARGS" == "$WORD" ]] && ARGS="" || ARGS="${ARGS#* }"
      ;;
  esac
done

# Trim leading space from ISSUE_NUMBERS
ISSUE_NUMBERS="${ISSUE_NUMBERS# }"

# -----------------------------------------------------------------------------
# VALIDATE INPUT AND DETERMINE MODE
# -----------------------------------------------------------------------------

if [[ -z "$MODE" ]]; then
  echo "❌ No issue numbers or branch name provided"
  echo ""
  echo "Usage:"
  echo "  Issue mode:  worktree-create.sh \"#123\" or \"#123 #124\""
  echo "  Direct mode: worktree-create.sh \"feature-branch-name\""
  exit 1
fi

# Check if gh is available (only needed for issue mode)
if [[ "$MODE" == "issue" ]]; then
  if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed or not in PATH"
    exit 1
  fi
fi

# Check if we're in a git repo
if ! git rev-parse --git-dir > /dev/null 2>&1; then
  echo "❌ Not in a git repository"
  exit 1
fi

# -----------------------------------------------------------------------------
# READ CONFIG
# -----------------------------------------------------------------------------

IDE_CMD="cursor"
IDE_NAME="Cursor"
TERMINAL_CMD=""
TERMINAL_NAME=""
PKG_MGR=""
WT_AUTO_OPEN_IDE="false"
WT_AUTO_OPEN_TERMINAL="false"
WT_SEED_ZOXIDE="false"

if [ -f ".workflow/config.json" ] && command -v jq &> /dev/null; then
  CONFIGURED_CMD=$(jq -r '.ide.command // empty' .workflow/config.json 2>/dev/null)
  CONFIGURED_NAME=$(jq -r '.ide.name // empty' .workflow/config.json 2>/dev/null)
  if [ -n "$CONFIGURED_CMD" ]; then
    IDE_CMD="$CONFIGURED_CMD"
    IDE_NAME="${CONFIGURED_NAME:-$CONFIGURED_CMD}"
  fi

  # Read terminal config
  CONFIGURED_TERM_CMD=$(jq -r '.terminal.command // empty' .workflow/config.json 2>/dev/null)
  CONFIGURED_TERM_NAME=$(jq -r '.terminal.name // empty' .workflow/config.json 2>/dev/null)
  if [ -n "$CONFIGURED_TERM_CMD" ]; then
    TERMINAL_CMD="$CONFIGURED_TERM_CMD"
    TERMINAL_NAME="${CONFIGURED_TERM_NAME:-$CONFIGURED_TERM_CMD}"
  fi

  # Read worktree behavior config
  WT_AUTO_OPEN_IDE=$(jq -r '.worktree.autoOpenIde // false' .workflow/config.json 2>/dev/null)
  WT_AUTO_OPEN_TERMINAL=$(jq -r '.worktree.autoOpenTerminal // false' .workflow/config.json 2>/dev/null)
  WT_SEED_ZOXIDE=$(jq -r '.worktree.seedZoxide // false' .workflow/config.json 2>/dev/null)

  # Read package manager config
  CONFIGURED_PKG_MGR=$(jq -r '.packageManager // empty' .workflow/config.json 2>/dev/null)
  if [ -n "$CONFIGURED_PKG_MGR" ]; then
    PKG_MGR="$CONFIGURED_PKG_MGR"
  fi
fi

# Fallback: detect package manager from lockfiles if not configured
if [ -z "$PKG_MGR" ]; then
  if [ -f "pnpm-lock.yaml" ]; then
    PKG_MGR="pnpm"
  elif [ -f "yarn.lock" ]; then
    PKG_MGR="yarn"
  elif [ -f "package-lock.json" ]; then
    PKG_MGR="npm"
  else
    PKG_MGR="npm"  # Default fallback
  fi
fi

# -----------------------------------------------------------------------------
# SMART BRANCH NAMING FUNCTION (for issue mode)
# -----------------------------------------------------------------------------

create_smart_branch_name() {
  local issue_nums="$1"
  local title="$2"
  local max_total=63  # Git's recommended branch name limit

  # Clean and prepare title - convert to lowercase and replace non-alphanumeric with dashes
  local clean_title=$(echo "$title" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g')

  # Calculate available space
  local prefix="feature/${issue_nums}-"
  local available=$((max_total - ${#prefix}))

  # Extract keywords intelligently
  # 1. Split into words (now separated by dashes)
  local words=($(echo "$clean_title" | tr '-' '\n' | grep -v '^$'))

  # 2. Filter out common words
  local filtered_words=()
  local common_words="the and or for with from into to a an in on at by of as is was be are been being have has had do does did will would could should may might must can implementation implement feature update add fix create make set get use"

  for word in "${words[@]}"; do
    # Skip empty words
    [ -z "$word" ] && continue

    # Check if word is in common words list
    if ! echo " $common_words " | grep -q " $word "; then
      filtered_words+=("$word")
    fi
  done

  # 3. Build description from most important words
  local description=""
  local word_count=0
  for word in "${filtered_words[@]}"; do
    # Skip empty words
    [ -z "$word" ] && continue

    # Add word if it fits
    local test_desc="${description}${description:+-}${word}"
    if [ ${#test_desc} -le $available ]; then
      description="$test_desc"
      word_count=$((word_count + 1))
      # Stop after 4-5 meaningful words for readability
      [ $word_count -ge 5 ] && break
    else
      # If we have at least 2 words, that's enough
      [ $word_count -ge 2 ] && break
      # Otherwise try to fit partial word
      local remaining=$((available - ${#description} - 1))
      if [ $remaining -ge 3 ]; then
        description="${description}${description:+-}${word:0:$remaining}"
      fi
      break
    fi
  done

  # Fallback if no meaningful description
  if [ -z "$description" ] || [ ${#description} -lt 3 ]; then
    # Just use first part of cleaned title
    description=$(echo "$clean_title" | sed 's/^-*//' | sed 's/-*$//' | cut -c1-$available)
  fi

  # Final cleanup of description
  description=$(echo "$description" | sed 's/--*/-/g' | sed 's/^-*//' | sed 's/-*$//')

  echo "${prefix}${description}"
}

# -----------------------------------------------------------------------------
# DETERMINE BRANCH NAME
# -----------------------------------------------------------------------------

if [[ "$MODE" == "issue" ]]; then
  ISSUE_COUNT=$(echo $ISSUE_NUMBERS | wc -w | tr -d ' ')

  echo "📋 Processing $ISSUE_COUNT issue(s): $(echo $ISSUE_NUMBERS | sed 's/\([0-9]\+\)/#\1/g')"
  echo ""

  if [ $ISSUE_COUNT -eq 1 ]; then
    # Single issue - use issue title in branch name
    ISSUE_TITLE=$(gh issue view $ISSUE_NUMBERS --json title -q .title)
    if [ -z "$ISSUE_TITLE" ]; then
      echo "❌ Could not fetch issue #$ISSUE_NUMBERS"
      exit 1
    fi
    echo "   Title: $ISSUE_TITLE"
    BRANCH_NAME=$(create_smart_branch_name "$ISSUE_NUMBERS" "$ISSUE_TITLE")
  else
    # Multiple issues - combine issue numbers and use first issue title
    ISSUE_NUMS_COMBINED=$(echo $ISSUE_NUMBERS | tr ' ' '-')
    FIRST_ISSUE=$(echo $ISSUE_NUMBERS | awk '{print $1}')
    FIRST_TITLE=$(gh issue view $FIRST_ISSUE --json title -q .title)
    if [ -z "$FIRST_TITLE" ]; then
      echo "❌ Could not fetch issue #$FIRST_ISSUE"
      exit 1
    fi
    echo "   First issue title: $FIRST_TITLE"
    BRANCH_NAME=$(create_smart_branch_name "$ISSUE_NUMS_COMBINED" "$FIRST_TITLE")
  fi
else
  # Direct mode - validate branch name
  echo "📋 Direct mode: using branch name '$BRANCH_NAME'"
  echo ""

  # Validate branch name length
  if [ ${#BRANCH_NAME} -gt 63 ]; then
    echo "❌ Branch name exceeds 63 characters (${#BRANCH_NAME} chars)"
    echo "   Git recommends branch names be 63 characters or less"
    echo "   Please use a shorter branch name"
    exit 1
  fi
fi

echo "   Branch: $BRANCH_NAME"

# -----------------------------------------------------------------------------
# CREATE WORKTREE
# -----------------------------------------------------------------------------

PROJECT_NAME=$(basename "$PWD")
WORKTREE_DIR="../${PROJECT_NAME}-worktrees"
WORKTREE_PATH="$WORKTREE_DIR/$BRANCH_NAME"
ORIGINAL_DIR="$PWD"

# We'll resolve the absolute path after mkdir + worktree creation (below)

echo ""
echo "📁 Creating worktree..."
echo "   Location: $WORKTREE_PATH"

mkdir -p "$WORKTREE_DIR"

# Check if worktree already exists
if [ -d "$WORKTREE_PATH" ]; then
  echo "   ⚠️  Worktree already exists, removing..."
  git worktree remove "$WORKTREE_PATH" --force 2>/dev/null || rm -rf "$WORKTREE_PATH"
fi

if [ "$CHECKOUT_MODE" = "true" ]; then
  # Checkout mode: fetch and track existing remote branch
  echo "   🔄 Fetching branch from origin..."

  # Check if branch exists on remote
  if ! git ls-remote --heads origin "$BRANCH_NAME" | grep -q "$BRANCH_NAME"; then
    echo "   ❌ Branch '$BRANCH_NAME' not found on origin"
    echo ""
    echo "   Available remote branches matching pattern:"
    git ls-remote --heads origin | grep -i "$(echo "$BRANCH_NAME" | cut -c1-20)" | head -5 || echo "   (none found)"
    exit 1
  fi

  git fetch origin "$BRANCH_NAME"

  # Check if local branch already exists
  if git show-ref --verify --quiet "refs/heads/$BRANCH_NAME"; then
    echo "   ⚠️  Local branch exists, creating worktree..."
    git worktree add "$WORKTREE_PATH" "$BRANCH_NAME"
    # Try fast-forward only - fails safely if diverged
    echo "   🔄 Attempting fast-forward update from origin..."
    if ! (cd "$WORKTREE_PATH" && git pull --ff-only origin "$BRANCH_NAME" 2>/dev/null); then
      echo "   ⚠️  Local branch has diverged from origin - manual resolution needed"
      echo "   To reset to origin: cd $WORKTREE_PATH && git reset --hard origin/$BRANCH_NAME"
      echo "   To merge: cd $WORKTREE_PATH && git pull origin $BRANCH_NAME"
    fi
  else
    # Create local tracking branch
    git worktree add --track -b "$BRANCH_NAME" "$WORKTREE_PATH" "origin/$BRANCH_NAME"
  fi
else
  # Create mode: new branch or use existing local branch
  if git show-ref --verify --quiet "refs/heads/$BRANCH_NAME"; then
    echo "   ⚠️  Branch already exists, creating worktree with existing branch..."
    git worktree add "$WORKTREE_PATH" "$BRANCH_NAME"
  else
    git worktree add "$WORKTREE_PATH" -b "$BRANCH_NAME"
  fi
fi

echo "   ✅ Worktree created"

# Resolve to absolute path for IDE/terminal commands and output
WORKTREE_PATH=$(cd "$WORKTREE_PATH" && pwd)

# Seed zoxide so `z <fragment>` finds this worktree immediately
if [ "$WT_SEED_ZOXIDE" = "true" ]; then
  if command -v /opt/homebrew/bin/zoxide >/dev/null 2>&1; then
    /opt/homebrew/bin/zoxide add "$WORKTREE_PATH"
    echo "   📍 Seeded zoxide with worktree path"
  fi
fi

# -----------------------------------------------------------------------------
# COPY ENVIRONMENT FILES
# -----------------------------------------------------------------------------

echo ""
echo "📄 Copying environment files..."
env_files_found=false

# Method 1: Use find with better error handling
while IFS= read -r envfile; do
  # Skip if empty
  [ -z "$envfile" ] && continue

  # Get the relative path from the original directory
  relative_path="${envfile#$ORIGINAL_DIR/}"
  target_dir="$WORKTREE_PATH/$(dirname "$relative_path")"

  # Create target directory if needed
  mkdir -p "$target_dir"

  if cp -p "$envfile" "$target_dir/"; then
    echo "   - Copied $relative_path"
    env_files_found=true
  fi
done < <(find -L "$ORIGINAL_DIR" -name '.env*' -type f 2>/dev/null | grep -v '/node_modules/' | grep -v '/.git/')

# Method 2: Explicitly check common monorepo locations
for parent_dir in apps packages; do
  if [ -d "$ORIGINAL_DIR/$parent_dir" ]; then
    for app_path in "$ORIGINAL_DIR/$parent_dir"/*; do
      if [ -d "$app_path" ]; then
        app_name=$(basename "$app_path")

        for env_pattern in .env .env.local .env.example .env.development .env.production; do
          if [ -f "$app_path/$env_pattern" ]; then
            target_app_dir="$WORKTREE_PATH/$parent_dir/$app_name"
            mkdir -p "$target_app_dir"

            if [ ! -f "$target_app_dir/$env_pattern" ]; then
              cp -p "$app_path/$env_pattern" "$target_app_dir/"
              echo "   - Copied $parent_dir/$app_name/$env_pattern"
              env_files_found=true
            fi
          fi
        done

        # If .env.local doesn't exist but .env.example does, create .env.local
        target_app_dir="$WORKTREE_PATH/$parent_dir/$app_name"
        if [ -f "$app_path/.env.example" ] && [ ! -f "$target_app_dir/.env.local" ]; then
          mkdir -p "$target_app_dir"
          cp "$app_path/.env.example" "$target_app_dir/.env.local"
          echo "   - Created $parent_dir/$app_name/.env.local from .env.example"
        fi
      fi
    done
  fi
done

if [ "$env_files_found" = false ]; then
  echo "   ℹ️  No .env files found in main worktree"
fi

# -----------------------------------------------------------------------------
# COPY DEVELOPMENT FOLDERS
# -----------------------------------------------------------------------------

echo ""
echo "📂 Copying development folders..."
for folder in .claude .workflow .cursor .vscode; do
  if [ -d "$ORIGINAL_DIR/$folder" ]; then
    if [ "$folder" = ".claude" ]; then
      # Use rsync to exclude session-local data (history, todomap)
      rsync -a --exclude='history/' --exclude='todomap/' "$ORIGINAL_DIR/$folder/" "$WORKTREE_PATH/$folder/"
    else
      cp -r "$ORIGINAL_DIR/$folder" "$WORKTREE_PATH/"
    fi
    echo "   - Copied $folder"
  fi
done

# Ensure .claude/settings.local.json is properly copied
if [ -f "$ORIGINAL_DIR/.claude/settings.local.json" ]; then
  cp -p "$ORIGINAL_DIR/.claude/settings.local.json" "$WORKTREE_PATH/.claude/settings.local.json"
  echo "   ✅ Preserved .claude/settings.local.json"
fi

# -----------------------------------------------------------------------------
# INSTALL DEPENDENCIES
# -----------------------------------------------------------------------------

if [ -f "$ORIGINAL_DIR/package.json" ]; then
  echo ""
  echo "📦 Installing dependencies using $PKG_MGR..."
  (
    cd "$WORKTREE_PATH"
    if command -v "$PKG_MGR" >/dev/null 2>&1; then
      # Run install, capturing exit code (don't fail on postinstall errors)
      set +e
      $PKG_MGR install
      INSTALL_EXIT_CODE=$?
      set -e

      # Check if install actually succeeded (node_modules exists with content)
      if [ -d "node_modules" ] && [ "$(ls -A node_modules 2>/dev/null)" ]; then
        if [ $INSTALL_EXIT_CODE -ne 0 ]; then
          echo "   ⚠️  Dependencies installed, but postinstall/build scripts had warnings (exit code $INSTALL_EXIT_CODE)"
        fi

        if grep -q '"build:packages"' package.json 2>/dev/null; then
          echo ""
          echo "🔨 Building workspace packages..."
          $PKG_MGR run build:packages || echo "   ⚠️  build:packages had warnings"
        fi
      else
        echo "   ❌ Dependency installation failed"
        exit 1
      fi
    else
      echo "   ⚠️  $PKG_MGR not found, trying fallback..."
      set +e
      FALLBACK_MGR=""
      if command -v pnpm >/dev/null 2>&1; then
        FALLBACK_MGR="pnpm"
        pnpm install
      elif command -v yarn >/dev/null 2>&1; then
        FALLBACK_MGR="yarn"
        yarn install
      elif command -v npm >/dev/null 2>&1; then
        FALLBACK_MGR="npm"
        npm install
      fi
      INSTALL_EXIT_CODE=$?
      set -e

      # Check if install actually succeeded (node_modules exists with content)
      if [ -d "node_modules" ] && [ "$(ls -A node_modules 2>/dev/null)" ]; then
        if [ $INSTALL_EXIT_CODE -ne 0 ]; then
          echo "   ⚠️  Dependencies installed, but postinstall/build scripts had warnings (exit code $INSTALL_EXIT_CODE)"
        fi

        if grep -q '"build:packages"' package.json 2>/dev/null && [ -n "$FALLBACK_MGR" ]; then
          echo ""
          echo "🔨 Building workspace packages..."
          $FALLBACK_MGR run build:packages || echo "   ⚠️  build:packages had warnings"
        fi
      else
        echo "   ❌ Dependency installation failed"
        exit 1
      fi
    fi
  )
  echo "   ✅ Dependencies installed"
fi

# -----------------------------------------------------------------------------
# OFFSET ALLOCATION HELPER
# -----------------------------------------------------------------------------

find_available_offset() {
  local worktree_dir="$1"
  local used_offsets=""

  # Collect offsets from all existing worktree metadata files
  if [ -d "$worktree_dir" ] && command -v jq &> /dev/null; then
    while IFS= read -r metadata_file; do
      [ -z "$metadata_file" ] && continue
      local offset_val
      offset_val=$(jq -r '.offset // empty' "$metadata_file" 2>/dev/null)
      if [ -n "$offset_val" ]; then
        used_offsets="$used_offsets $offset_val"
      fi
    done < <(find "$worktree_dir" -maxdepth 2 -name ".worktree-metadata.json" -type f 2>/dev/null)
  fi

  # Reserved offsets: 0 (main repo default), 20 (collides with main Supabase ports 54321-54329)
  used_offsets="$used_offsets 0 20"

  # Find lowest available multiple of 10, starting from 10
  local candidate=10
  while [ "$candidate" -le 990 ]; do
    # Skip reserved offset 20
    if [ "$candidate" -eq 20 ]; then
      candidate=$((candidate + 10))
      continue
    fi

    # Check if candidate is already used
    local is_used=false
    for used in $used_offsets; do
      if [ "$candidate" -eq "$used" ]; then
        is_used=true
        break
      fi
    done

    if [ "$is_used" = false ]; then
      echo "$candidate"
      return 0
    fi

    candidate=$((candidate + 10))
  done

  # Fallback: no available offset found (extremely unlikely with 97 slots)
  echo "10"
  return 1
}

# -----------------------------------------------------------------------------
# COMPUTE WORKTREE BUILDING BLOCKS
# -----------------------------------------------------------------------------
# These values are exported for post_create hooks to use.
# Hooks can use or ignore them as needed.
# -----------------------------------------------------------------------------

# Extract first issue number (used for port allocation and metadata)
FIRST_ISSUE=$(echo "$ISSUE_NUMBERS" | awk '{print $1}')

# Compute offset for port uniqueness: (issue % 100) * 10
# This gives each worktree a unique port range while keeping numbers manageable
# Example: issue #123 → offset 230, issue #7 → offset 70
if [[ -n "$FIRST_ISSUE" && "$FIRST_ISSUE" =~ ^[0-9]+$ ]]; then
  WORKTREE_OFFSET=$(( (FIRST_ISSUE % 100) * 10 ))
else
  # For direct branch mode, auto-scan existing worktrees to find next available offset
  WORKTREE_OFFSET=$(find_available_offset "$WORKTREE_DIR")
fi

# Export building blocks for hooks
export WORKTREE_PATH="$WORKTREE_PATH"
export WORKTREE_BRANCH="$BRANCH_NAME"
export WORKTREE_ISSUE="$FIRST_ISSUE"
export WORKTREE_OFFSET="$WORKTREE_OFFSET"
export WORKTREE_ORIGINAL_DIR="$ORIGINAL_DIR"

# -----------------------------------------------------------------------------
# RUN POST-CREATE HOOK (if configured)
# -----------------------------------------------------------------------------
# Project-specific setup is handled by a hook script configured in
# .workflow/config.json under "worktree.post_create"
#
# Example config:
#   {
#     "worktree": {
#       "post_create": ".claude/commands/scripts/worktree-setup.sh"
#     }
#   }
#
# The hook receives these environment variables:
#   WORKTREE_PATH       - Full path to the new worktree
#   WORKTREE_BRANCH     - Branch name
#   WORKTREE_ISSUE      - Issue number (if created from issue, else empty)
#   WORKTREE_OFFSET     - Computed offset for port uniqueness
#   WORKTREE_ORIGINAL_DIR - Path to the main repository
#   WORKTREE_HOOK_ARGS  - Additional args passed after -- separator
#
# The hook also receives args after -- as positional parameters ($1, $2, etc.)
# Example: /project:worktree:create #123 -- --shared --no-start
#   → Hook receives: $1="--shared", $2="--no-start"
#   → And: WORKTREE_HOOK_ARGS="--shared --no-start"
# -----------------------------------------------------------------------------

POST_CREATE_HOOK=""
if [ -f "$ORIGINAL_DIR/.workflow/config.json" ] && command -v jq &> /dev/null; then
  POST_CREATE_HOOK=$(jq -r '.worktree.post_create // empty' "$ORIGINAL_DIR/.workflow/config.json" 2>/dev/null)
fi

if [ -n "$POST_CREATE_HOOK" ]; then
  HOOK_PATH="$WORKTREE_PATH/$POST_CREATE_HOOK"
  if [ -f "$HOOK_PATH" ]; then
    echo ""
    echo "🔌 Running post-create hook..."
    echo "   Script: $POST_CREATE_HOOK"
    echo "   WORKTREE_OFFSET=$WORKTREE_OFFSET"
    if [ -n "$HOOK_ARGS" ]; then
      echo "   Hook args: $HOOK_ARGS"
    fi
    echo ""

    # Export hook args as env var (hook can also receive as positional args)
    export WORKTREE_HOOK_ARGS="$HOOK_ARGS"

    # Pass hook args as positional arguments
    # shellcheck disable=SC2086
    if bash "$HOOK_PATH" $HOOK_ARGS; then
      echo ""
      echo "   ✅ Post-create hook completed"
    else
      echo ""
      echo "   ⚠️  Post-create hook had warnings or errors (exit code $?)"
    fi
  else
    echo ""
    echo "⚠️  Post-create hook configured but not found: $POST_CREATE_HOOK"
  fi
else
  echo ""
  echo "ℹ️  No post-create hook configured"
  echo "   To add project-specific setup, configure in .workflow/config.json:"
  echo '   {'
  echo '     "worktree": {'
  echo '       "post_create": ".claude/commands/scripts/worktree-setup.sh"'
  echo '     }'
  echo '   }'
fi

# -----------------------------------------------------------------------------
# GENERATE WORKTREE METADATA
# -----------------------------------------------------------------------------

echo ""
echo "📋 Generating worktree metadata..."

# Determine worktree ID from issue or branch
if [[ -n "$FIRST_ISSUE" && "$FIRST_ISSUE" =~ ^[0-9]+$ ]]; then
  WORKTREE_ID="issue-${FIRST_ISSUE}"
else
  WORKTREE_ID=$(echo "$BRANCH_NAME" | sed 's/[^a-zA-Z0-9]/-/g')
fi

# Generate metadata file with building blocks
# Hooks can add their own data to this file if needed
if command -v jq &> /dev/null; then
  jq -n \
    --arg id "$WORKTREE_ID" \
    --arg branch "$BRANCH_NAME" \
    --arg issue "$FIRST_ISSUE" \
    --argjson offset "$WORKTREE_OFFSET" \
    --arg created "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    '{
      worktree_id: $id,
      branch_name: $branch,
      issue: (if $issue == "" then null else ($issue | tonumber) end),
      offset: $offset,
      created_at: $created
    }' > "$WORKTREE_PATH/.worktree-metadata.json"
else
  # Fallback without jq
  cat > "$WORKTREE_PATH/.worktree-metadata.json" << METADATA_JSON
{
  "worktree_id": "${WORKTREE_ID}",
  "branch_name": "${BRANCH_NAME}",
  "issue": ${FIRST_ISSUE:-null},
  "offset": ${WORKTREE_OFFSET},
  "created_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
METADATA_JSON
fi

echo "   ✅ Created .worktree-metadata.json"

# -----------------------------------------------------------------------------
# BUILD HANDOFF COMMAND (issue mode only)
# -----------------------------------------------------------------------------

HANDOFF_CMD=""
if [[ "$MODE" == "issue" ]]; then
  # Convert issue numbers to proper format
  ISSUE_ARGS=$(echo $ISSUE_NUMBERS | sed 's/\([0-9]\+\)/#\1/g')
  HANDOFF_CMD="/project:issues:implement ${ISSUE_ARGS} --on-worktree"

  # Add context if provided
  if [ -n "$CONTEXT_VALUE" ]; then
    HANDOFF_CMD="$HANDOFF_CMD --context \"$CONTEXT_VALUE\""
  fi
fi

# -----------------------------------------------------------------------------
# AUTO-OPEN IDE AND TERMINAL (if configured)
# -----------------------------------------------------------------------------

if [ "$WT_AUTO_OPEN_IDE" = "true" ] && [ -n "$IDE_CMD" ]; then
  echo ""
  echo "🖥️  Opening $IDE_NAME..."
  $IDE_CMD "$WORKTREE_PATH" &
fi

if [ "$WT_AUTO_OPEN_TERMINAL" = "true" ] && [ -n "$TERMINAL_CMD" ]; then
  echo "🖥️  Opening $TERMINAL_NAME at worktree..."
  env -u CLAUDECODE $TERMINAL_CMD -d "$WORKTREE_PATH" &
fi

# Copy handoff command to clipboard (issue mode) or path (direct mode)
if [ -n "$HANDOFF_CMD" ]; then
  echo -n "$HANDOFF_CMD" | pbcopy 2>/dev/null && CLIPBOARD_CONTENT="handoff command"
elif command -v pbcopy >/dev/null 2>&1; then
  echo -n "$WORKTREE_PATH" | pbcopy 2>/dev/null && CLIPBOARD_CONTENT="worktree path"
fi

# -----------------------------------------------------------------------------
# OUTPUT SUMMARY
# -----------------------------------------------------------------------------

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
if [ "$CHECKOUT_MODE" = "true" ]; then
  echo "✅ Checked out worktree from origin: $BRANCH_NAME"
elif [[ "$MODE" == "issue" ]]; then
  if [ $ISSUE_COUNT -eq 1 ]; then
    echo "✅ Created worktree for issue #$ISSUE_NUMBERS"
  else
    echo "✅ Created worktree for issues: $(echo $ISSUE_NUMBERS | sed 's/\([0-9]\+\)/#\1/g')"
  fi
else
  echo "✅ Created worktree: $BRANCH_NAME"
fi
echo ""
echo "📁 Location: $WORKTREE_PATH"
echo "🌿 Branch: $BRANCH_NAME"
echo "🔢 Offset: $WORKTREE_OFFSET (for port uniqueness)"
if [ -f "$WORKTREE_PATH/package.json" ]; then
  echo "📦 Dependencies installed"
  if grep -q '"build:packages"' "$WORKTREE_PATH/package.json" 2>/dev/null; then
    echo "🔨 Workspace packages built"
  fi
fi
if [ -n "$CLIPBOARD_CONTENT" ]; then
  echo "📋 Copied $CLIPBOARD_CONTENT to clipboard"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🚀 NEXT STEPS"
echo ""

if [ "$WT_AUTO_OPEN_IDE" = "true" ]; then
  echo "   $IDE_NAME is opening automatically..."
else
  echo "Step 1: Open the worktree in $IDE_NAME"
  echo ""
  echo "    $IDE_CMD $WORKTREE_PATH"
  echo ""
fi

if [[ "$MODE" == "issue" ]]; then
  if [ "$WT_AUTO_OPEN_IDE" = "true" ]; then
    echo ""
    echo "   In the new Claude session, paste (Cmd+V) the handoff command:"
  else
    echo "Step 2: In the new Claude session, run:"
  fi
  echo ""
  echo "    $HANDOFF_CMD"
  echo ""
else
  if [ "$WT_AUTO_OPEN_IDE" != "true" ]; then
    echo "Step 2: Start working in the new worktree"
    echo ""
  fi
fi

echo "💡 Tips:"
echo "   - Check .env files: ls -la $WORKTREE_PATH/.env* $WORKTREE_PATH/apps/*/.env* 2>/dev/null"
echo "   - Port offset $WORKTREE_OFFSET available for dev servers (e.g., --port $((3000 + WORKTREE_OFFSET)))"
echo "   - For git merge/pull with skip-worktree files: use worktree-git.sh wrapper"
echo "   - Start Claude via the IDE extension when ready"
echo ""
