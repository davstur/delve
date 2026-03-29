# Destroy Container Development Environment

Completely removes a container development environment including:

- Dev container (created by IDE)
- Supabase containers
- Docker network
- Docker volumes
- Local project directory

## Command Input

<arguments>
#$ARGUMENTS
</arguments>

Arguments:

- `--issue <number>` - Destroy environment for issue (container ID:
  `issue-<number>`)
- `--branch <name>` - Destroy environment for branch (container ID derived from
  branch name)
- `--id <container-id>` - Destroy by container ID directly
- `--force` - Skip confirmation prompt
- `--keep-local` - Preserve local project directory

Examples:

```
/session:container:destroy --issue 123
/session:container:destroy --branch test/devcontainer-v4
/session:container:destroy --id issue-123
/session:container:destroy --issue 123 --force
/session:container:destroy --branch feature/foo --keep-local
```

## Execution

**IMPORTANT: Execute this single script. It performs all cleanup in one
command.**

**🚨 IF IN SANDBOX MODE: This script deletes paths outside this repo
(`~/Development/*-containers/`, Docker containers/networks/volumes). Must run
with `dangerouslyDisableSandbox: true`.**

```bash
#!/bin/bash
set -e

# =============================================================================
# CONTAINER DESTRUCTION SCRIPT
# Single-script execution for speed and reliability
# =============================================================================

echo "🗑️  Destroying container development environment..."
echo ""

# -----------------------------------------------------------------------------
# PARSE ARGUMENTS
# -----------------------------------------------------------------------------

CONTAINER_ID=""
FORCE=false
KEEP_LOCAL=false

ARGS="$ARGUMENTS"
while [[ -n "$ARGS" ]]; do
  case "$ARGS" in
    --id\ *)
      ARGS="${ARGS#--id }"
      CONTAINER_ID="${ARGS%% *}"
      [[ "$ARGS" == "$CONTAINER_ID" ]] && ARGS="" || ARGS="${ARGS#* }"
      ;;
    --issue\ *)
      ARGS="${ARGS#--issue }"
      ISSUE_NUM="${ARGS%% *}"
      CONTAINER_ID="issue-$ISSUE_NUM"
      [[ "$ARGS" == "$ISSUE_NUM" ]] && ARGS="" || ARGS="${ARGS#* }"
      ;;
    --branch\ *)
      ARGS="${ARGS#--branch }"
      BRANCH="${ARGS%% *}"
      CONTAINER_ID=$(echo "$BRANCH" | sed 's/[^a-zA-Z0-9]/-/g')
      [[ "$ARGS" == "$BRANCH" ]] && ARGS="" || ARGS="${ARGS#* }"
      ;;
    --force*)
      FORCE=true
      ARGS="${ARGS#--force}"
      ARGS="${ARGS# }"
      ;;
    --keep-local*)
      KEEP_LOCAL=true
      ARGS="${ARGS#--keep-local}"
      ARGS="${ARGS# }"
      ;;
    *)
      ARGS="${ARGS#* }"
      [[ "$ARGS" == "${ARGS%% *}" ]] && ARGS=""
      ;;
  esac
done

if [ -z "$CONTAINER_ID" ]; then
  echo "❌ Error: Must specify --id, --issue, or --branch"
  echo ""
  echo "Usage:"
  echo "  /session:container:destroy --issue 123"
  echo "  /session:container:destroy --id issue-123"
  echo "  /session:container:destroy --branch feature/foo"
  exit 1
fi

echo "🎯 Target: $CONTAINER_ID"

# -----------------------------------------------------------------------------
# FIND ENVIRONMENT RESOURCES
# -----------------------------------------------------------------------------

PROJECT_DIR=""
METADATA=""

CURRENT_REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo "")

if [ -n "$CURRENT_REPO_ROOT" ]; then
  REPO_PARENT=$(dirname "$CURRENT_REPO_ROOT")
  for containers_dir in "$REPO_PARENT"/*-containers; do
    if [ -d "$containers_dir/$CONTAINER_ID" ]; then
      PROJECT_DIR="$containers_dir/$CONTAINER_ID"
      break
    fi
  done
fi

if [ -z "$PROJECT_DIR" ]; then
  for containers_dir in "$HOME"/Development/*-containers "$HOME"/Development/*/*-containers; do
    if [ -d "$containers_dir/$CONTAINER_ID" ]; then
      PROJECT_DIR="$containers_dir/$CONTAINER_ID"
      break
    fi
  done
fi

if [ -z "$PROJECT_DIR" ] && [ -d "$HOME/dev-containers" ]; then
  for dir in "$HOME/dev-containers"/*-"$CONTAINER_ID" "$HOME/dev-containers"/"$CONTAINER_ID"; do
    if [ -d "$dir" ]; then
      PROJECT_DIR="$dir"
      break
    fi
  done
fi

if [ -n "$PROJECT_DIR" ] && [ -f "$PROJECT_DIR/.container-metadata.json" ]; then
  METADATA=$(cat "$PROJECT_DIR/.container-metadata.json")
fi

if [ -n "$METADATA" ]; then
  NETWORK=$(echo "$METADATA" | jq -r '.network // empty')
  REPO_SLUG=$(echo "$METADATA" | jq -r '.repo_slug // empty')
  BRANCH_NAME=$(echo "$METADATA" | jq -r '.branch_name // empty')
  DEVCONTAINER_NAME=$(echo "$METADATA" | jq -r '.devcontainer_name // empty')
  SUPABASE_ENABLED=$(echo "$METADATA" | jq -r '.supabase.enabled // false')
else
  NETWORK=$(docker network ls --format '{{.Name}}' | grep "$CONTAINER_ID" | head -1)
  DEVCONTAINER_NAME="devcontainer-.*-${CONTAINER_ID}"
fi

if [ -n "$NETWORK" ]; then
  ASSOCIATED_CONTAINERS=$(docker ps -a --filter "network=$NETWORK" --format '{{.Names}}' 2>/dev/null || true)
else
  ASSOCIATED_CONTAINERS=$(docker ps -a --format '{{.Names}}' | grep "$CONTAINER_ID" || true)
fi

DEVCONTAINER=$(docker ps -a --format '{{.Names}}' | grep -E "devcontainer.*$CONTAINER_ID" | head -1 || true)

echo ""
echo "📋 Environment Details:"
if [ -n "$PROJECT_DIR" ]; then
  echo "   Project Directory: $PROJECT_DIR"
fi
if [ -n "$NETWORK" ]; then
  echo "   Network: $NETWORK"
fi
if [ -n "$BRANCH_NAME" ]; then
  echo "   Branch: $BRANCH_NAME"
fi

# -----------------------------------------------------------------------------
# LIST RESOURCES TO REMOVE
# -----------------------------------------------------------------------------

echo ""
echo "🗑️  Resources to be removed:"
echo ""

echo "   Containers:"
if [ -n "$ASSOCIATED_CONTAINERS" ]; then
  for container in $ASSOCIATED_CONTAINERS; do
    STATUS=$(docker inspect -f '{{.State.Status}}' "$container" 2>/dev/null || echo "unknown")
    echo "     • $container ($STATUS)"
  done
else
  echo "     (none found)"
fi

VOLUMES_TO_REMOVE=()
for container in $ASSOCIATED_CONTAINERS; do
  CONTAINER_VOLUMES=$(docker inspect -f '{{range .Mounts}}{{if eq .Type "volume"}}{{.Name}} {{end}}{{end}}' "$container" 2>/dev/null || true)
  for vol in $CONTAINER_VOLUMES; do
    if [[ ! " ${VOLUMES_TO_REMOVE[@]} " =~ " ${vol} " ]]; then
      VOLUMES_TO_REMOVE+=("$vol")
    fi
  done
done

if [ ${#VOLUMES_TO_REMOVE[@]} -gt 0 ]; then
  echo ""
  echo "   Volumes:"
  for vol in "${VOLUMES_TO_REMOVE[@]}"; do
    echo "     • $vol"
  done
fi

if [ -n "$NETWORK" ]; then
  echo ""
  echo "   Network:"
  echo "     • $NETWORK"
fi

if [ -n "$PROJECT_DIR" ] && [ "$KEEP_LOCAL" = false ]; then
  echo ""
  echo "   Local Directory:"
  echo "     • $PROJECT_DIR"
fi

# -----------------------------------------------------------------------------
# CONFIRM DESTRUCTION
# -----------------------------------------------------------------------------

if [ "$FORCE" = false ]; then
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "⚠️  WARNING: This will permanently destroy the environment."
  echo "   All database data will be lost!"
  if [ -n "$PROJECT_DIR" ] && [ "$KEEP_LOCAL" = false ]; then
    echo "   Local project directory will be deleted!"
  fi
  echo ""
  read -p "Type 'destroy' to confirm: " CONFIRM

  if [ "$CONFIRM" != "destroy" ]; then
    echo ""
    echo "❌ Destruction cancelled"
    exit 0
  fi
fi

echo ""
echo "🔄 Destroying environment..."

# -----------------------------------------------------------------------------
# STOP AND REMOVE CONTAINERS
# -----------------------------------------------------------------------------

if [ -n "$ASSOCIATED_CONTAINERS" ]; then
  echo ""
  echo "🛑 Stopping containers..."

  for container in $ASSOCIATED_CONTAINERS; do
    echo -n "   Stopping $container... "
    if docker stop "$container" > /dev/null 2>&1; then
      echo "✅"
    else
      echo "⚠️ (already stopped or failed)"
    fi
  done

  echo ""
  echo "🗑️  Removing containers..."

  for container in $ASSOCIATED_CONTAINERS; do
    echo -n "   Removing $container... "
    if docker rm -f "$container" > /dev/null 2>&1; then
      echo "✅"
    else
      echo "❌ Failed"
    fi
  done
fi

# -----------------------------------------------------------------------------
# REMOVE VOLUMES
# -----------------------------------------------------------------------------

if [ ${#VOLUMES_TO_REMOVE[@]} -gt 0 ]; then
  echo ""
  echo "🗑️  Removing volumes..."

  for vol in "${VOLUMES_TO_REMOVE[@]}"; do
    echo -n "   Removing $vol... "
    if docker volume rm "$vol" > /dev/null 2>&1; then
      echo "✅"
    else
      echo "⚠️ (in use or not found)"
    fi
  done
fi

# -----------------------------------------------------------------------------
# REMOVE NETWORK
# -----------------------------------------------------------------------------

if [ -n "$NETWORK" ]; then
  echo ""
  echo "🌐 Removing network..."
  echo -n "   Removing $NETWORK... "
  if docker network rm "$NETWORK" > /dev/null 2>&1; then
    echo "✅"
  else
    echo "⚠️ (in use or not found)"
  fi
fi

# -----------------------------------------------------------------------------
# REMOVE LOCAL DIRECTORY
# -----------------------------------------------------------------------------

if [ -n "$PROJECT_DIR" ] && [ -d "$PROJECT_DIR" ] && [ "$KEEP_LOCAL" = false ]; then
  echo ""
  echo "📁 Removing local directory..."

  # Safety check: ensure PROJECT_DIR is inside a *-containers directory
  case "$PROJECT_DIR" in
    *-containers/*)
      echo -n "   Removing $PROJECT_DIR... "
      if rm -rf "$PROJECT_DIR"; then
        echo "✅"
      else
        echo "❌ Failed"
      fi
      ;;
    *)
      echo "   ⚠️ Skipping removal - path doesn't match expected pattern"
      echo "   Manual removal required: $PROJECT_DIR"
      ;;
  esac
fi

# -----------------------------------------------------------------------------
# CLEANUP TEMPORARY FILES
# -----------------------------------------------------------------------------

TEMP_COMPOSE="/tmp/supabase-${CONTAINER_ID}.yml"
if [ -f "$TEMP_COMPOSE" ]; then
  rm -f "$TEMP_COMPOSE"
fi

# -----------------------------------------------------------------------------
# FINAL SUMMARY
# -----------------------------------------------------------------------------

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Environment destroyed successfully"
echo ""
echo "   Removed:"
CONTAINER_COUNT=$(echo "$ASSOCIATED_CONTAINERS" | wc -w | tr -d ' ')
echo "     • $CONTAINER_COUNT container(s)"
if [ ${#VOLUMES_TO_REMOVE[@]} -gt 0 ]; then
  echo "     • ${#VOLUMES_TO_REMOVE[@]} volume(s)"
fi
if [ -n "$NETWORK" ]; then
  echo "     • 1 network"
fi
if [ -n "$PROJECT_DIR" ] && [ "$KEEP_LOCAL" = false ]; then
  echo "     • 1 local directory"
fi

if [ -n "$BRANCH_NAME" ]; then
  echo ""
  echo "💡 Note: The branch '$BRANCH_NAME' may still exist in the remote repository."
  echo "   If the PR was merged, you can delete it:"
  echo ""
  echo "   git push origin --delete $BRANCH_NAME"
fi

echo ""
```

## Notes

- **Single-script execution** - One permission prompt, deterministic
- The `--keep-local` flag preserves the local project directory (useful for
  debugging)
- IDE-created containers are detected by name pattern (`devcontainer-*`)
- Supabase containers are identified by the shared network
- Safety check prevents rm-rf outside of `*-containers/` directories
- Always removes Docker volumes to ensure clean state
