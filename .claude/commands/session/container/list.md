# List Container Development Environments

Shows all container development environments (both prepared and running) with
their status, ports, and associated issues/branches.

## Command Input

<arguments>
#$ARGUMENTS
</arguments>

Optional flags:

- `--all` - Show all environments (including those without running containers)
- `--repo <name>` - Filter by repository name
- `--json` - Output in JSON format

Examples:

```
/session:container:list
/session:container:list --all
/session:container:list --repo my-project
/session:container:list --json
```

## Execution

**IMPORTANT: Execute this single script.**

```bash
#!/bin/bash

# =============================================================================
# CONTAINER LIST SCRIPT
# Single-script execution for speed and reliability
# =============================================================================

# -----------------------------------------------------------------------------
# PARSE ARGUMENTS
# -----------------------------------------------------------------------------

SHOW_ALL=false
FILTER_REPO=""
JSON_OUTPUT=false

ARGS="$ARGUMENTS"
while [[ -n "$ARGS" ]]; do
  case "$ARGS" in
    --all*)
      SHOW_ALL=true
      ARGS="${ARGS#--all}"
      ARGS="${ARGS# }"
      ;;
    --repo\ *)
      ARGS="${ARGS#--repo }"
      FILTER_REPO="${ARGS%% *}"
      [[ "$ARGS" == "$FILTER_REPO" ]] && ARGS="" || ARGS="${ARGS#* }"
      ;;
    --json*)
      JSON_OUTPUT=true
      ARGS="${ARGS#--json}"
      ARGS="${ARGS# }"
      ;;
    *)
      ARGS="${ARGS#* }"
      [[ "$ARGS" == "${ARGS%% *}" ]] && ARGS=""
      ;;
  esac
done

# -----------------------------------------------------------------------------
# FIND ALL ENVIRONMENTS
# -----------------------------------------------------------------------------

ENVIRONMENTS=()

CURRENT_REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo "")

if [ -n "$CURRENT_REPO_ROOT" ]; then
  REPO_PARENT=$(dirname "$CURRENT_REPO_ROOT")
  for containers_dir in "$REPO_PARENT"/*-containers; do
    if [ -d "$containers_dir" ]; then
      for dir in "$containers_dir"/*/; do
        if [ -f "${dir}.container-metadata.json" ]; then
          ENVIRONMENTS+=("$dir")
        fi
      done
    fi
  done
fi

while IFS= read -r containers_dir; do
  if [ -d "$containers_dir" ]; then
    for dir in "$containers_dir"/*/; do
      if [ -f "${dir}.container-metadata.json" ]; then
        if [[ ! " ${ENVIRONMENTS[*]} " =~ " ${dir} " ]]; then
          ENVIRONMENTS+=("$dir")
        fi
      fi
    done
  fi
done < <(find "$HOME/Development" -maxdepth 2 -type d -name "*-containers" 2>/dev/null)

if [ -d "$HOME/dev-containers" ]; then
  for dir in "$HOME/dev-containers"/*/; do
    if [ -f "${dir}.container-metadata.json" ]; then
      if [[ ! " ${ENVIRONMENTS[*]} " =~ " ${dir} " ]]; then
        ENVIRONMENTS+=("$dir")
      fi
    fi
  done
fi

if [ ${#ENVIRONMENTS[@]} -eq 0 ]; then
  echo "No container development environments found."
  echo ""
  echo "💡 Create one with: /session:container:create --issue <number>"
  exit 0
fi

# -----------------------------------------------------------------------------
# DISPLAY ENVIRONMENTS
# -----------------------------------------------------------------------------

if [ "$JSON_OUTPUT" = false ]; then
  echo ""
  echo "🐳 Container Development Environments"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
fi

if [ "$JSON_OUTPUT" = true ]; then
  echo "["
fi

RUNNING_COUNT=0
PREPARED_COUNT=0
first=true

for dir in "${ENVIRONMENTS[@]}"; do
  METADATA=$(cat "${dir}.container-metadata.json")

  CONTAINER_ID=$(echo "$METADATA" | jq -r '.container_id // empty')
  DEVCONTAINER_NAME=$(echo "$METADATA" | jq -r '.devcontainer_name // empty')
  ISSUE_NUMBER=$(echo "$METADATA" | jq -r '.issue_number // empty')
  BRANCH_NAME=$(echo "$METADATA" | jq -r '.branch_name // empty')
  REPO_SLUG=$(echo "$METADATA" | jq -r '.repo_slug // empty')
  NETWORK=$(echo "$METADATA" | jq -r '.network // empty')
  APP_PORT=$(echo "$METADATA" | jq -r '.ports.app_base // empty')
  SUPABASE_PORT=$(echo "$METADATA" | jq -r '.ports.supabase_base // empty')
  SUPABASE_ENABLED=$(echo "$METADATA" | jq -r '.supabase.enabled // false')
  CREATED_AT=$(echo "$METADATA" | jq -r '.created_at // empty')
  PROJECT_DIR=$(echo "$METADATA" | jq -r '.project_dir // empty')

  if [ -n "$FILTER_REPO" ]; then
    if [[ "$REPO_SLUG" != *"$FILTER_REPO"* ]]; then
      continue
    fi
  fi

  DEVCONTAINER_STATUS="not created"
  DEVCONTAINER_RUNNING=false

  if [ -n "$DEVCONTAINER_NAME" ]; then
    if docker ps -a --format '{{.Names}}' | grep -q "^${DEVCONTAINER_NAME}$"; then
      DEVCONTAINER_STATUS=$(docker inspect -f '{{.State.Status}}' "$DEVCONTAINER_NAME" 2>/dev/null || echo "unknown")
      if [ "$DEVCONTAINER_STATUS" = "running" ]; then
        DEVCONTAINER_RUNNING=true
      fi
    fi
  fi

  NETWORK_EXISTS=false
  if [ -n "$NETWORK" ] && docker network inspect "$NETWORK" > /dev/null 2>&1; then
    NETWORK_EXISTS=true
  fi

  SUPABASE_RUNNING=false
  SUPABASE_CONTAINERS=0
  if [ "$SUPABASE_ENABLED" = "true" ] && [ "$NETWORK_EXISTS" = true ]; then
    SUPABASE_CONTAINERS=$(docker ps --filter "network=$NETWORK" --format '{{.Names}}' | grep -c 'supabase' || echo "0")
    if [ "$SUPABASE_CONTAINERS" -gt 0 ]; then
      SUPABASE_RUNNING=true
    fi
  fi

  if [ "$SHOW_ALL" = false ] && [ "$DEVCONTAINER_RUNNING" = false ] && [ "$NETWORK_EXISTS" = false ]; then
    continue
  fi

  if [ "$DEVCONTAINER_RUNNING" = true ]; then
    RUNNING_COUNT=$((RUNNING_COUNT + 1))
  elif [ "$NETWORK_EXISTS" = true ]; then
    PREPARED_COUNT=$((PREPARED_COUNT + 1))
  fi

  if [ "$JSON_OUTPUT" = true ]; then
    if [ "$first" = false ]; then
      echo ","
    fi
    first=false

    cat << EOF
  {
    "container_id": "$CONTAINER_ID",
    "project_dir": "$PROJECT_DIR",
    "devcontainer_name": "$DEVCONTAINER_NAME",
    "devcontainer_status": "$DEVCONTAINER_STATUS",
    "network": "$NETWORK",
    "network_exists": $NETWORK_EXISTS,
    "issue_number": ${ISSUE_NUMBER:-null},
    "branch_name": "$BRANCH_NAME",
    "repo_slug": "$REPO_SLUG",
    "ports": {
      "app_base": ${APP_PORT:-null},
      "supabase_base": ${SUPABASE_PORT:-null}
    },
    "supabase": {
      "enabled": $SUPABASE_ENABLED,
      "running": $SUPABASE_RUNNING,
      "container_count": $SUPABASE_CONTAINERS
    },
    "created_at": "$CREATED_AT"
  }
EOF
    continue
  fi

  if [ "$DEVCONTAINER_RUNNING" = true ]; then
    STATUS_ICON="🟢"
    STATUS_TEXT="Dev container running"
  elif [ "$NETWORK_EXISTS" = true ]; then
    STATUS_ICON="🟡"
    STATUS_TEXT="Infrastructure ready (open in IDE to start)"
  else
    STATUS_ICON="⚪"
    STATUS_TEXT="Stale (infrastructure removed)"
  fi

  echo "$STATUS_ICON $CONTAINER_ID"
  echo "   Status: $STATUS_TEXT"

  if [ -n "$ISSUE_NUMBER" ] && [ "$ISSUE_NUMBER" != "null" ]; then
    echo "   Issue: #$ISSUE_NUMBER"
  fi

  if [ -n "$BRANCH_NAME" ]; then
    echo "   Branch: $BRANCH_NAME"
  fi

  if [ -n "$REPO_SLUG" ]; then
    echo "   Repository: $REPO_SLUG"
  fi

  echo "   Project: $PROJECT_DIR"

  if [ -n "$APP_PORT" ] && [ "$APP_PORT" != "null" ]; then
    echo "   Ports: App=${APP_PORT}, Supabase=${SUPABASE_PORT:-N/A}"
  fi

  if [ -n "$CREATED_AT" ]; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
      CREATED_EPOCH=$(date -j -f "%Y-%m-%dT%H:%M:%SZ" "$CREATED_AT" "+%s" 2>/dev/null || echo "0")
    else
      CREATED_EPOCH=$(date -d "$CREATED_AT" "+%s" 2>/dev/null || echo "0")
    fi
    CURRENT_EPOCH=$(date "+%s")
    AGE_HOURS=$(( (CURRENT_EPOCH - CREATED_EPOCH) / 3600 ))

    if [ "$AGE_HOURS" -lt 0 ]; then
      AGE_HOURS=0
    fi

    if [ $AGE_HOURS -lt 24 ]; then
      echo "   Age: ${AGE_HOURS}h"
    else
      AGE_DAYS=$((AGE_HOURS / 24))
      echo "   Age: ${AGE_DAYS}d"
    fi
  fi

  if [ "$SUPABASE_ENABLED" = "true" ]; then
    if [ "$SUPABASE_RUNNING" = true ]; then
      echo "   Supabase: ✅ Running ($SUPABASE_CONTAINERS containers)"
    elif [ "$NETWORK_EXISTS" = true ]; then
      echo "   Supabase: ⚠️ Stopped (run docker compose up)"
    else
      echo "   Supabase: ❌ Not running"
    fi
  fi

  echo ""
done

if [ "$JSON_OUTPUT" = true ]; then
  echo "]"
  exit 0
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Summary: $RUNNING_COUNT running, $PREPARED_COUNT prepared"
echo ""
echo "💡 Commands:"
echo "   Open in IDE:    Open project directory, then 'Reopen in Container'"
echo "   Destroy env:    /session:container:destroy --id <container-id>"
echo "   Create new:     /session:container:create --issue <number>"
echo ""
```

## Output Example

```
🐳 Container Development Environments
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🟢 issue-123
   Status: Dev container running
   Issue: #123
   Branch: feature/123-user-authentication
   Repository: org/myproject
   Project: /Users/me/dev-containers/myproject-issue-123
   Ports: App=3230, Supabase=54332
   Age: 2h
   Supabase: ✅ Running (2 containers)

🟡 issue-456
   Status: Infrastructure ready (open in IDE to start)
   Issue: #456
   Branch: feature/456-payment-integration
   Repository: org/myproject
   Project: /Users/me/dev-containers/myproject-issue-456
   Ports: App=3560, Supabase=54562
   Age: 1d
   Supabase: ✅ Running (2 containers)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Summary: 1 running, 1 prepared

💡 Commands:
   Open in IDE:    Open project directory, then 'Reopen in Container'
   Destroy env:    /session:container:destroy --id <container-id>
   Create new:     /session:container:create --issue <number>
```

## Status Indicators

| Icon | Meaning                                                                       |
| ---- | ----------------------------------------------------------------------------- |
| 🟢   | Dev container running (full IDE-in-container experience)                      |
| 🟡   | Infrastructure ready (network, Supabase), waiting for IDE to create container |
| ⚪   | Stale - local directory exists but infrastructure removed                     |

## Notes

- **Single-script execution** - One permission prompt, deterministic
- Environments are tracked via `.container-metadata.json` in each project
  directory
- The "prepared" state means our infrastructure is ready, but IDE hasn't created
  the container yet
- Use `--json` for programmatic access to environment information
- Use `--repo` to filter by project when working on multiple repositories
