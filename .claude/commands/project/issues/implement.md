# Implementation Command

You are an experienced software developer tasked with implementing a GitHub
issue. Your goal is to transform a well-documented issue into working, tested
code that meets all acceptance criteria.

## Package Manager

Check `.workflow/config.json` for the `packageManager` setting (e.g., `pnpm`,
`yarn`, `npm`). Use that package manager for all commands (install, test, build,
etc.). If not configured, detect from lockfiles or default to `npm`.

## ⚠️ CRITICAL: Order of Operations

**🚨 FIRST CHECK - BEFORE ANYTHING ELSE:**

```
IF arguments contain "--worktree":
    → GO DIRECTLY to section 1.5
    → CREATE worktree
    → PROVIDE handoff command
    → EXIT (do not continue)
ELSE:
    → Continue with normal flow below
```

**MANDATORY SEQUENCE - DO NOT DEVIATE:**

1. Parse arguments to identify issues and check for special flags (`--worktree`)
2. **IF --worktree flag is present**: Skip to section 1.5 immediately (create
   worktree and EXIT) - **NO OTHER STEPS**
3. **OTHERWISE**: Check if issues are in "Ready" status
4. **IMMEDIATELY** move ready issues to "In Progress" (before ANY other action)
5. Process --context, analyze code
6. Surface any **pre-breakdown clarifications** (scope, approach, or taste
   decisions that would change the breakdown's shape)
7. **🔍 ALWAYS run breakdown** (Section 4.1) — present the command, confirm with
   user, then execute before implementation
8. Only THEN create branch and start implementation

**This order is NON-NEGOTIABLE. The --worktree flag creates a special flow that
bypasses normal implementation. For all other cases, status updates come
FIRST.**

## Prerequisites

1. Ensure GitHub CLI (`gh`) is configured and authenticated
2. Check that you're in a git repository
3. Verify you have necessary development tools installed
4. **IMPORTANT**: Issues must be in "Ready" status on the project board
   (indicates human review and readiness for implementation)

## 🐛 Common Issues and Troubleshooting

### Parse Errors: `(eval):1: parse error near '('`

If you encounter this error when executing bash commands from this workflow:

```
Error: (eval):1: parse error near `('
```

**Root Cause**: Command substitution syntax `$(...)` is not compatible with all
shell environments, particularly when nested or used in certain contexts.

**Common Problematic Patterns**:

```bash
# ❌ FAILS: Nested command substitution in single line
owner=$(gh repo view --json owner -q .owner.login) && \
PROJECT_JSON=$(gh project list --owner "$owner" --format json) && \
PROJECT_NUMBER=$(echo "$PROJECT_JSON" | jq -r '.projects[0].number')

# ❌ FAILS: Command substitution inside variable assignment within compound statement
if [ $(gh issue view 123 --json state -q .state) = "OPEN" ]; then echo "open"; fi
```

**Safe Alternative Patterns**:

```bash
# ✅ WORKS: Break into separate sequential commands
gh repo view --json owner -q .owner.login
# (Store the output, then use it in the next command)

# ✅ WORKS: Use intermediate variables across multiple bash invocations
# First call:
owner=$(gh repo view --json owner -q .owner.login)
echo "$owner"

# Second call (use the value from previous output):
gh project list --owner "alexeigs" --format json

# ✅ WORKS: Simple command substitution without nesting
owner=$(gh repo view --json owner -q .owner.login)
echo "Owner: $owner"
```

**Step-by-Step Workaround**:

When you hit a parse error in a complex command chain:

1. **Identify all command substitutions** - Look for `$(...)` patterns
2. **Break into individual commands** - Execute each `$(...)` separately
3. **Store intermediate results** - Save output and use it in subsequent
   commands
4. **Use simple chaining** - Connect related commands with `&&` for sequential
   execution

**Example Conversion**:

```bash
# Original (may fail):
ITEM_ID=$(gh project item-list $PROJECT_NUMBER --owner "$owner" --limit $issue_number --format json | \
  jq -r ".items[] | select(.content.number == $issue_number) | .id")

# Safe alternative (execute separately):
# Command 1: Get the raw JSON
gh project item-list 6 --owner alexeigs --limit 430 --format json

# Command 2: Parse the JSON with jq (using actual values from command 1)
# ... | jq -r '.items[] | select(.content.number == 430) | .id'
```

### Invalid Branch Name Errors

If users see errors like:

```
fatal: 'feature/123-branch name with spaces' is not a valid branch name
```

**Root Cause**: The `create_smart_branch_name()` function in section 1.5 had a
bug where spaces weren't properly converted to dashes.

**Fix Applied**: Line 227 now uses `sed 's/[^a-z0-9]/-/g'` (without preserving
spaces) and properly filters common words.

**Branch Naming Logic**:

- Converts to lowercase and replaces all non-alphanumeric chars with dashes
- Removes common words (the, and, for, etc.)
- Keeps 4-5 meaningful keywords
- Limits total length to 63 characters (Git recommendation)
- Example: "Fix Design System Border Token Redundancy" →
  "feature/339-design-system-border-token-redundancy"

## Project Board Configuration

**GitHub Projects v2 are owned by users/organizations, not repositories.**

Specify which project to use by creating `.workflow/config.json`:

```json
{
  "github": {
    "project_number": 8,
    "project_title": "Your Project Name"
  }
}
```

Find your project number with:
`gh project list --owner $(gh repo view --json owner -q .owner.login) --format json`

- `project_number` (recommended): Direct project access by number - faster, no
  listing required
- `project_title`: Fallback matching by name - more readable, requires listing
  all projects

The owner is auto-detected from the repo's remote origin, so `project_number: 4`
in an org repo uses the org's project #4, not your personal project #4.

**Note**: A single project can be linked to multiple repositories, and vice
versa.

## Command Input

<arguments>
#$ARGUMENTS
</arguments>

Parse the arguments which should include:

- Issue number(s) (e.g., "#123" or "#123 #124 #125")
- OR milestone with flag: `--milestone "Milestone Name"`
- Optional: `--context "implementation guidance"`
- Optional: `--worktree` - Create worktree first **🚨 EARLY EXIT**
- Optional: `--on-worktree` - Skip branch creation (already in worktree)
- Optional: `--in-container` - Skip branch creation (already in container)
- Optional: `--container` - Create container first **🚨 EARLY EXIT** (delegates
  to /session:container:create)

**🚨 CRITICAL FLOW DIAGRAM:**

```
┌─────────────────────┐
│  Parse Arguments    │
└──────────┬──────────┘
           ▼
    ┌──────────────┐
    │ --worktree?  │──YES──▶ Section 1.5 (CREATE WORKTREE) ──▶ EXIT
    └──────┬───────┘
           │ NO
           ▼
    ┌──────────────┐
    │ --container? │──YES──▶ Section 1.6 (CREATE CONTAINER) ──▶ EXIT
    └──────┬───────┘
           │ NO
           ▼
    ┌───────────────┐
    │ Continue with │
    │ Normal Flow   │
    │ (Steps 2-7)   │
    └───────────────┘

Note: --on-worktree and --in-container skip branch creation in normal flow
```

Examples:

```
# Issue-based implementation
/project:issues:implement #123
/project:issues:implement #123 --context "use React hooks, not class components"
/project:issues:implement #123 #124 #125 --context "implement full auth flow"

# Milestone-based implementation
/project:issues:implement --milestone "Authentication Core"
/project:issues:implement --milestone "Hello Production" --context "focus on essential features only"

# Worktree-based implementation
/project:issues:implement #123 --worktree
/project:issues:implement #123 --worktree --context "use React hooks"
/project:issues:implement #123 #124 --worktree  # Multiple related issues
# These create worktree and provide exact command to run there

# In worktree (command provided by above)
/project:issues:implement #123 --on-worktree
/project:issues:implement #123 --on-worktree --context "use React hooks"

# Container-based implementation
/project:issues:implement #123 --container
/project:issues:implement #123 --container --context "use new API patterns"
# These create container environment and provide handoff instructions

# In container (command provided by above)
/project:issues:implement #123 --in-container
/project:issues:implement #123 --in-container --context "use React hooks"
```

## Implementation Process

### ⚠️ CRITICAL FIRST CHECK: --worktree or --container FLAG

**🚨 STOP AND READ: Check for --worktree or --container flag IMMEDIATELY**

- IF `--worktree` flag is present → **SKIP EVERYTHING** and go directly to
  section 1.5
- IF `--container` flag is present → **SKIP EVERYTHING** and go directly to
  section 1.6
- These flags create SPECIAL FLOWS that bypass ALL normal steps
- DO NOT check status, DO NOT ask about breakdown, DO NOT analyze code
- **Jump IMMEDIATELY to section 1.5 or 1.6 if these flags are present**

### CRITICAL FIRST STEPS - DO NOT SKIP OR REORDER

**IMPORTANT**: These steps MUST be completed in this EXACT order. The --worktree
flag is the ONLY exception that changes this flow.

### 1. Parse and Validate

**⚠️ FIRST ACTION: Check for --worktree flag**

```
if arguments contain "--worktree":
    GO TO SECTION 1.5 IMMEDIATELY
    DO NOT CONTINUE WITH STEPS BELOW
```

1. **Parse input mode** (ONLY if no --worktree flag):
   - **Issue mode**: Extract issue numbers from arguments
     - Single issue: proceed normally
     - Multiple issues: enter multi-issue mode
   - **Milestone mode**: If `--milestone` flag present
     - Extract milestone name
     - Fetch all issues in that milestone
     - Analyze for logical grouping
   - **Special flags**:
     - `--worktree`: Create worktree before implementation
     - `--on-worktree`: Skip branch creation step (already in worktree)

**🔄 DECISION POINT: Check for special flags**

- IF `--worktree` is present → **STOP HERE** → Go to section 1.5 (worktree
  creation flow)
- ELSE → Continue to step 2 (normal flow)

  1.5. **⚠️ SPECIAL FLOW: Handle --worktree flag** (if present):

**🚨 CRITICAL: This is an EARLY EXIT flow**

- When you reach this section, you will **NOT** continue to any other steps
- **NO** status checking
- **NO** moving issues to "In Progress"
- **NO** asking about breakdown preference
- **NO** codebase analysis
- **ONLY** create the worktree and provide handoff instructions

**IMPORTANT: This section ONLY applies when --worktree flag is detected. This is
an EARLY EXIT flow - you will NOT continue to step 2 or any other steps.**

- **Validation**: Works with single or multiple issues (not milestone)
- **Command transformation examples**:

  ```
  Original: /project:issues:implement #123 --worktree
  Handoff:  /project:issues:implement #123 --on-worktree

  Original: /project:issues:implement #123 --worktree --context "use React hooks"
  Handoff:  /project:issues:implement #123 --on-worktree --context "use React hooks"

  Original: /project:issues:implement #456 --worktree --context "follow new API patterns"
  Handoff:  /project:issues:implement #456 --on-worktree --context "follow new API patterns"

  Original: /project:issues:implement #123 #124 --worktree
  Handoff:  /project:issues:implement #123 #124 --on-worktree

  Original: /project:issues:implement #276 #277 --worktree --context "implement webhook features"
  Handoff:  /project:issues:implement #276 #277 --on-worktree --context "implement webhook features"
  ```

- **Execute worktree creation script**:

  **🚨 IF IN SANDBOX MODE: This script writes to paths outside this repo. Must
  run with `dangerouslyDisableSandbox: true`.**

  This command delegates to a single bash script that handles all worktree setup
  operations (branch naming, git worktree creation, file copying, dependency
  installation).

  ```bash
  bash ".claude/commands/scripts/worktree-create.sh" "$ARGUMENTS"
  ```

  The script will:
  1. Parse issue numbers and context from arguments
  2. Fetch issue titles for smart branch naming
  3. Create the worktree with a descriptive branch name
  4. Copy .env files and development folders (.claude, .workflow, etc.)
  5. Install dependencies and build workspace packages if needed
  6. Output next steps with the handoff command

- **EXIT** after creating worktree (do not continue implementation)

**🚨 FULL STOP - END OF COMMAND**

**When --worktree flag is used:**

- ❌ DO NOT check ready status
- ❌ DO NOT move issues to "In Progress"
- ❌ DO NOT ask about breakdown preference
- ❌ DO NOT analyze the codebase
- ❌ DO NOT fetch issue details
- ❌ DO NOT continue with ANY other steps
- ✅ ONLY create worktree and provide handoff command
- ✅ EXIT immediately after displaying instructions

**The command ENDS HERE when --worktree is used.**

**FINAL OUTPUT REQUIREMENTS**: When using `--worktree`, the script outputs
success information. Your final message should summarize the key details:

1. Success confirmation with issue number(s)
2. **Clear 2-step instructions** for opening and continuing work
3. The handoff command to run in the new session

**Note**: The worktree-create.sh script automatically reads IDE config from
`.workflow/config.json` and uses the correct IDE name/command in its output. Use
the actual values from the script output, not hardcoded examples.

Example final message format (values come from script output):

```
✅ Successfully created worktree for issue(s) #[NUMBERS]

📋 **Next Steps (2-step process):**

Step 1: Open the worktree in [IDE_NAME]
[IDE_CMD] [WORKTREE_PATH]

Step 2: Start implementation (once [IDE_NAME] loads)
Run this command in Claude Code:
/project:issues:implement #[NUMBER] --on-worktree
```

1.6. **⚠️ SPECIAL FLOW: Handle --container flag** (if present):

**🚨 CRITICAL: This is an EARLY EXIT flow - similar to --worktree but for
containers**

When `--container` flag is detected:

- ❌ DO NOT check ready status
- ❌ DO NOT move issues to "In Progress"
- ❌ DO NOT ask about breakdown preference
- ❌ DO NOT analyze the codebase
- ✅ ONLY delegate to `/session:container:create`
- ✅ EXIT immediately after providing handoff instructions

**Process:**

1. **Delegate to container creation command**:

   Inform the user that you will create a containerized development environment:

   ```
   🐳 Creating container environment for issue #[NUMBER]...

   This will:
   - Create an isolated Docker container with full repo clone
   - Start a dedicated Supabase local stack
   - Set up unique port mappings
   - Generate MCP configuration

   Delegating to /session:container:create --issue [NUMBER]
   ```

2. **Build handoff command**:

   ```bash
   # Start with base command
   HANDOFF_CMD="/project:issues:implement #${ISSUE_NUMBER} --in-container"

   # Preserve --context if provided
   if [[ "$ORIGINAL_ARGS" == *"--context"* ]]; then
       CONTEXT_VALUE=$(extract_context_value_from_args)
       HANDOFF_CMD="$HANDOFF_CMD --context \"$CONTEXT_VALUE\""
   fi
   ```

3. **Provide handoff instructions**:

   After container creation completes (via /session:container:create), summarize
   the key details from the script output.

   **Note**: The container-create.sh script automatically reads IDE config from
   `.workflow/config.json` and provides IDE-specific instructions in its output.
   Use the actual values from the script output, not hardcoded examples.

   Example final message format (values come from script output):

   ```
   ✅ Container environment created for issue #[NUMBER]

   📋 **Next Steps:**

   Step 1: Open in [IDE_NAME]
   [IDE_CMD] [PROJECT_DIR]

   Step 2: When [IDE_NAME] opens, accept 'Reopen in Container' prompt
   (WebStorm: File → Remote Dev → Dev Containers → From Local Project)

   Step 3: Run claude in the container terminal, then:
   [HANDOFF_CMD]

   Step 4: When done (PR merged), destroy the environment:
   /session:container:destroy --issue [NUMBER]
   ```

**The command ENDS HERE when --container is used.**

2. **Check readiness (labels and project status)**:

   For each issue, check both labels AND project board status:

   a) **Check blocking labels**:

   ```bash
   gh issue view <issue_number> --json labels
   ```

   b) **Check project board status** (if project exists):

   ```bash
   # Find project - IMPORTANT: GitHub Projects v2 are owned by users/orgs, not repos
   # You may need to specify which project if the owner has multiple
   gh project list --owner <owner> --format json

   # If multiple projects exist, user must specify which one (e.g., by title)
   # Example: gh project list --owner <owner> --format json | jq '.projects[] | select(.title == "My Project")'

   # Get issue's status (directly available at .status)
   # Set limit equal to issue number to ensure we can find it
   gh project item-list <project-number> --owner <owner> --limit <issue_number> --format json | \
     jq -r '.items[] | select(.content.number == <issue_number>) | .status // "No Status"'
   ```

   **Readiness criteria**:
   - Blocking labels: `📝 draft`, `❓ needs-clarification`, `👷‍♂️ manual`
   - Native GitHub blocking relationships (check via GraphQL `blockedBy` query)
   - Board status:
     - "No Status" → ⚠️ Not ready (needs human review)
     - "Todo" → ⚠️ Not ready (needs to be moved to Ready)
     - "Ready" → ✅ Ready to implement
     - "In Progress" → 📌 Resuming work
     - "Done" → ❌ Already completed

   ```
   Checking readiness...
   ✅ #123: Ready (Status: Ready)
   ⚠️  #124: Not ready - Status: Todo (move to Ready when prepared)
   ⚠️  #125: Not ready - Status: No Status (needs review)
   ❌ #126: Not ready - Label: 📝 draft
   📌 #127: Resuming - Status: In Progress

   Ready to implement: #123, #127
   Continue? (Y/n)
   ```

   **CRITICAL VALIDATION**:
   - If NO issues are ready → EXIT with error
   - If issue is not on the board → EXIT with error (do NOT add it)
   - If issue is not in "Ready" status → EXIT with error (do NOT move it)
   - ONLY proceed if issue is already on board AND in "Ready" status

   **Example validation code**:

   ```bash
   # Check if issue is on the board and get status
   # Set limit equal to issue number to ensure we can find it
   ISSUE_STATUS=$(gh project item-list $PROJECT_NUMBER --owner "$owner" --limit $issue_number --format json | \
     jq -r ".items[] | select(.content.number == $issue_number) | .status // empty")

   if [ -z "$ISSUE_STATUS" ]; then
     echo "❌ ERROR: Issue #$issue_number is not on the project board"
     echo "Please add it to the project board and move it to 'Ready' status first"
     exit 1
   fi

   if [ "$ISSUE_STATUS" != "Ready" ] && [ "$ISSUE_STATUS" != "In Progress" ]; then
     echo "❌ ERROR: Issue #$issue_number is in status '$ISSUE_STATUS', not 'Ready'"
     echo "Please move the issue to 'Ready' status on the project board first"
     exit 1
   fi
   ```

   **CRITICAL**: If user continues, IMMEDIATELY move ready issues to "In
   Progress" before ANY other action.

3. **Milestone mode processing** (if --milestone flag used):

   a) **Fetch milestone issues**:

   ```bash
   # Get milestone ID
   gh api repos/:owner/:repo/milestones --jq '.[] | select(.title == "Milestone Name") | .number'

   # Get all issues in milestone
   gh issue list --milestone "Milestone Name" --state open --json number,title,labels,body
   ```

   b) **Analyze for intelligent grouping**:
   - Identify dependencies between issues
   - Find related issues that share code/components
   - Consider logical implementation order
   - Group issues that form cohesive units (max 3-4 per group)

   c) **Present implementation plan**:

   ```
   Analyzing milestone "Authentication Core" (5 issues):

   Suggested implementation approach:

   Group 1: Core Authentication (implement together)
   - #101: Create auth database schema
   - #102: Add login API endpoint
   - #103: Add signup API endpoint
   Rationale: These share models and tests

   Group 2: Authentication UI (separate PR)
   - #104: Create login form component
   - #105: Create signup form component

   Proceed with Group 1? (Y/n/custom)
   ```

   Options:
   - Y: Implement suggested group
   - n: Cancel
   - custom: "Which issues? (e.g., #101 #102)"

   **IMPORTANT**: After selecting issues from milestone, IMMEDIATELY validate
   their readiness (return to step 2) before continuing.

### 2. MANDATORY: Move ALL Ready Issues to "In Progress" IMMEDIATELY

**This step MUST happen NOW, before ANY of the following:**

- Before fetching full issue details
- Before analyzing codebase
- Before creating branches
- Before processing --context content
- Before asking ANY clarifying questions

**⚠️ BASH COMPATIBILITY NOTE**: This function uses command substitution
`$(...)`. If you encounter parse errors, execute these commands separately
instead of using the function. See "Common Issues and Troubleshooting" section
(lines 45-111) for step-by-step alternatives.

```bash
# Function to move an issue to "In Progress"
# NOTE: If this function fails with parse errors, execute the commands inside it
# one at a time, storing intermediate results in variables.
move_to_in_progress() {
  local issue_number=$1

  # SAFE PATTERN: Break these into separate commands if you get parse errors
  # Step 1: Get owner
  local owner=$(gh repo view --json owner -q .owner.login)
  # Step 2: Get repo
  local repo=$(gh repo view --json name -q .name)

  # Get project info - CRITICAL: Must select the correct project
  PROJECT_JSON=$(gh project list --owner "$owner" --format json)
  PROJECT_COUNT=$(echo "$PROJECT_JSON" | jq -r '.projects | length')

  if [ "$PROJECT_COUNT" = "0" ]; then
    echo "❌ No project board found for owner: $owner"
    return 1
  fi

  # Check for project configuration - prefer project_number over project_title
  PROJECT_NUMBER=""
  PROJECT_TITLE=""

  # Check .workflow/config.json
  if [ -f ".workflow/config.json" ]; then
    # First try project_number (direct, faster)
    CONFIG_NUMBER=$(jq -r '.github.project_number // empty' .workflow/config.json 2>/dev/null)
    if [ -n "$CONFIG_NUMBER" ]; then
      PROJECT_NUMBER="$CONFIG_NUMBER"
      # Get project ID from the number
      PROJECT_ID=$(echo "$PROJECT_JSON" | jq -r --argjson num "$PROJECT_NUMBER" '.projects[] | select(.number == $num) | .id')
      if [ -n "$PROJECT_ID" ]; then
        echo "📋 Using project #$PROJECT_NUMBER (from config)"
      else
        echo "❌ Configured project_number $PROJECT_NUMBER not found"
        echo "Available projects:"
        echo "$PROJECT_JSON" | jq -r '.projects[] | "  - \(.title) (#\(.number))"'
        return 1
      fi
    else
      # Fall back to project_title
      CONFIG_TITLE=$(jq -r '.github.project_title // empty' .workflow/config.json 2>/dev/null)
      if [ -n "$CONFIG_TITLE" ]; then
        PROJECT_TITLE="$CONFIG_TITLE"
      fi
    fi
  fi

  # If we have a configured project title (fallback), use it
  if [ -z "$PROJECT_NUMBER" ] && [ -n "$PROJECT_TITLE" ]; then
    PROJECT_DATA=$(echo "$PROJECT_JSON" | jq --arg title "$PROJECT_TITLE" -r '.projects[] | select(.title == $title)')
    if [ -z "$PROJECT_DATA" ]; then
      echo "❌ Configured project '$PROJECT_TITLE' not found"
      echo "Available projects:"
      echo "$PROJECT_JSON" | jq -r '.projects[] | "  - \(.title) (#\(.number))"'
      return 1
    fi
    PROJECT_NUMBER=$(echo "$PROJECT_DATA" | jq -r '.number')
    PROJECT_ID=$(echo "$PROJECT_DATA" | jq -r '.id')
    echo "📋 Using project from configuration: $PROJECT_TITLE (#$PROJECT_NUMBER)"
  elif [ -z "$PROJECT_NUMBER" ]; then
    # No config - check if single project or need user input
    if [ "$PROJECT_COUNT" = "1" ]; then
      # Single project - use it
      PROJECT_NUMBER=$(echo "$PROJECT_JSON" | jq -r '.projects[0].number')
      PROJECT_ID=$(echo "$PROJECT_JSON" | jq -r '.projects[0].id')
      PROJECT_TITLE=$(echo "$PROJECT_JSON" | jq -r '.projects[0].title')
      echo "📋 Using only available project: $PROJECT_TITLE (#$PROJECT_NUMBER)"
    else
      # Multiple projects and no configuration - need user to specify
      echo "⚠️  Multiple projects found for owner $owner:"
      echo "$PROJECT_JSON" | jq -r '.projects[] | "  - \(.title) (#\(.number))"'
      echo ""
      echo "Please specify which project to use in .workflow/config.json:"
      echo '{'
      echo '  "github": {'
      echo '    "project_number": 4,'
      echo '    "project_title": "Your Project Name"'
      echo '  }'
      echo '}'
      return 1
    fi
  fi

    # Get item ID for the issue
    # Set limit equal to issue number to ensure we can find it
    ITEM_ID=$(gh project item-list $PROJECT_NUMBER --owner "$owner" --limit $issue_number --format json | \
      jq -r ".items[] | select(.content.number == $issue_number) | .id")

    if [ -n "$ITEM_ID" ]; then
      # Get field IDs
      STATUS_FIELD_ID=$(gh project field-list $PROJECT_NUMBER --owner "$owner" --format json | \
        jq -r '.fields[] | select(.name == "Status") | .id')
      IN_PROGRESS_ID=$(gh project field-list $PROJECT_NUMBER --owner "$owner" --format json | \
        jq -r '.fields[] | select(.name == "Status") | .options[] | select(.name == "In Progress") | .id')

      # Move to "In Progress"
      gh project item-edit \
        --id "$ITEM_ID" \
        --field-id "$STATUS_FIELD_ID" \
        --project-id "$PROJECT_ID" \
        --single-select-option-id "$IN_PROGRESS_ID"

      echo "✅ Moved issue #$issue_number to 'In Progress'"
    fi
  fi
}

# Move ALL ready issues to "In Progress" NOW
# For single issue: move_to_in_progress 123
# For multiple: move_to_in_progress 123; move_to_in_progress 127
```

**DO NOT PROCEED until ALL ready issues show "In Progress" status.**

### 2.3. Activate Linked Stories (if present)

After moving issues to "In Progress", check if any issues have linked user
stories. If found, automatically move the story from `todo/` to `active/` to
indicate active work.

```bash
# Function to check for and activate linked stories
activate_linked_story() {
  local issue_number=$1

  # Get issue body
  local issue_body=$(gh issue view $issue_number --json body -q .body)

  # Check for story reference patterns:
  # - Story: [name](docs/stories/todo/story-name.md)
  # - Related story: stories/todo/story-name.md
  # - See: docs/stories/todo/story-name.md
  local story_path=$(echo "$issue_body" | grep -oE '(docs/)?stories/todo/[a-zA-Z0-9_-]+\.md' | head -1)

  if [ -n "$story_path" ]; then
    # Check if story file exists
    if [ -f "$story_path" ]; then
      # Extract story filename
      local story_name=$(basename "$story_path")

      # Determine if using docs/ prefix
      local prefix=""
      if [[ "$story_path" == docs/* ]]; then
        prefix="docs/"
      fi

      # Construct paths
      local active_path="${prefix}stories/active/$story_name"

      # Move story to active
      mkdir -p "$(dirname "$active_path")"
      git mv "$story_path" "$active_path" 2>/dev/null || mv "$story_path" "$active_path"

      echo "📖 Activated linked story: $story_name"

      # Update issue comment to note story activation
      gh issue comment $issue_number --body "🤖 Claude Code activated linked user story: [\`$story_name\`]($active_path)

Story moved from \`todo/\` to \`active/\` to track implementation progress."

      return 0
    else
      echo "⚠️  Issue #$issue_number references story at $story_path, but file not found"
      return 1
    fi
  fi

  # No linked story found
  return 0
}

# Check and activate stories for ALL issues being implemented
# For single issue: activate_linked_story 123
# For multiple: activate_linked_story 123; activate_linked_story 127
```

**Story activation is optional** - if no story is linked or the file doesn't
exist, continue normally with implementation.

### 2.5. MANDATORY: Handle "needs-clarification" Label

**CRITICAL**: After moving issues to "In Progress", check EACH issue for the "❓
needs-clarification" label. If present, you MUST obtain clarifications before
proceeding with implementation.

```bash
# Check for needs-clarification label on each issue
check_needs_clarification() {
  local issue_number=$1
  local labels=$(gh issue view $issue_number --json labels -q '.labels[].name')

  if echo "$labels" | grep -q "❓ needs-clarification"; then
    echo "🔍 Issue #$issue_number has the 'needs-clarification' label"
    return 0
  else
    return 1
  fi
}

# For each issue being implemented
for issue in $ISSUES_TO_IMPLEMENT; do
  if check_needs_clarification $issue; then
    NEEDS_CLARIFICATION+=($issue)
  fi
done

# If any issues need clarification
if [ ${#NEEDS_CLARIFICATION[@]} -gt 0 ]; then
  echo "⚠️  The following issues require clarification before implementation:"
  for issue in "${NEEDS_CLARIFICATION[@]}"; do
    echo "   - Issue #$issue"
  done
fi
```

**If "needs-clarification" is present:**

1. **Analyze the issue to identify unclear areas**:
   - Read the issue description thoroughly
   - Identify ambiguous requirements
   - Note missing technical details
   - List undefined acceptance criteria

2. **Ask specific clarifying questions**:

   ```
   🔍 Issue #123 needs clarification:

   After analyzing the issue, I have the following questions:

   1. **Database Schema**: The issue mentions "user preferences" but doesn't specify:
      - Should preferences be stored in JSON or normalized tables?
      - What specific preferences need to be tracked?

   2. **API Design**: For the preference endpoint:
      - Should it be REST (/api/preferences) or GraphQL?
      - Do we need PATCH for partial updates or just PUT?

   3. **UI Behavior**: When a user changes preferences:
      - Should changes save automatically or require a "Save" button?
      - What happens if the save fails - rollback or retry?

   My recommendations:
   - Use JSON column for flexibility (can add preferences without schema changes)
   - REST with PATCH support (consistent with other endpoints)
   - Explicit save with optimistic UI updates

   Please confirm or provide alternative approaches.
   ```

3. **Wait for user response and clarification**

4. **Once clarified, remove the label**:

   ```bash
   # After receiving satisfactory clarification
   gh issue edit $issue_number --remove-label "❓ needs-clarification"
   echo "✅ Removed 'needs-clarification' label from issue #$issue_number"
   ```

5. **Document the clarifications** in the issue:

   ```bash
   gh issue comment $issue_number --body "## Clarifications Received

   Based on our discussion, here are the confirmed implementation details:

   1. **Database**: Using JSON column for preferences
   2. **API**: REST endpoint with PATCH support at /api/preferences
   3. **UI**: Explicit save button with optimistic updates

   These clarifications have been incorporated into the implementation plan."
   ```

**DO NOT PROCEED with implementation until ALL clarifications are obtained and
the label is removed.**

### 2.9 Update Workflow Status

```bash
mkdir -p .workflow && echo '{"phase":"Analyzing issue","command":"implement","startedAt":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}' > .workflow/status.json
```

### 3. Fetch Issue Details and Analyze

**⚠️ REMINDER: Skip this entire section if --worktree was present**

**Only NOW, after issues are in "In Progress", should you:**

1. **Fetch issue details**:

   ```bash
   # Get issue body and all comments in one call
   gh issue view <issue_number> --json title,body,labels,comments
   ```

   - Extract requirements, acceptance criteria, and technical approach
   - **Read all comments** - they often contain clarifications, decisions, or
     additional implementation guidance added after the issue was created
   - Note any linked user story or related issues
   - Check labels and priority

2. **Check for parent issue (epic context)**:

   If this issue is a sub-issue of a larger epic/parent, fetch the parent for
   broader context:

   ```bash
   # Get repository info
   OWNER=$(gh repo view --json owner -q .owner.login)
   REPO=$(gh repo view --json name -q .name)

   # Check if issue has a parent
   gh api graphql -H "GraphQL-Features: sub_issues" -f query='
   {
     repository(owner: "'"$OWNER"'", name: "'"$REPO"'") {
       issue(number: <issue_number>) {
         parent {
           number
           title
           body
         }
       }
     }
   }'
   ```

   **If a parent issue exists:**
   - Read the parent issue's title and body for high-level context
   - Understand how this sub-issue fits into the larger feature/epic
   - Check if the parent has acceptance criteria that apply to all sub-issues
   - Note any architectural decisions or constraints from the parent
   - Consider fetching parent comments if they contain relevant guidance:
     ```bash
     gh issue view <parent_number> --json comments -q '.comments[].body'
     ```

   **Example output when parent exists:**

   ```
   📋 Parent Issue Context:
   Epic #42: "User Authentication System"

   This issue (#123: "Add password reset endpoint") is part of the larger
   authentication epic. Parent context:
   - Must use existing JWT infrastructure
   - All auth endpoints need rate limiting
   - Follow RFC 6749 for OAuth compatibility
   ```

3. **Process --context flag** (if provided):
   - NOW you can analyze the --context content
   - Ask any clarifying questions based on context
   - Incorporate guidance into implementation plan

4. **Analyze the codebase**:
   - Understand current project structure
   - Identify files that need modification or creation
   - Look for similar patterns in existing code
   - Check for project patterns (linting, testing, etc.)
   - Check `CLAUDE.md` files and `.claude/rules/` for coding guidance
   - Review `PLATFORM.md` for domain context and principles
   - **Verify technical details** as you implement:
     - Framework versions may have changed since issue creation
     - Check specific API docs when implementing complex features
     - Use available tools (WebSearch, context7) for implementation details
     - But follow the issue's overall approach unless clearly outdated

5. **Pre-breakdown clarification check** (quick — skip if nothing to surface):

   Before running the breakdown, briefly review the issue for any **scope,
   approach, or taste decisions** that would fundamentally change the
   breakdown's structure. These are questions where the wrong assumption means
   the breakdown needs re-doing — not implementation details (those come after).

   **Examples of what qualifies:**
   - **Scope boundaries**: "Does 'notifications' include email, or just in-app?"
     — doubles or halves the task list
   - **Taste/design choices**: "Should this be a modal or a dedicated page?" —
     changes the component tree entirely
   - **Competing approaches**: "Extend existing system vs. build new?" —
     different dependency graphs

   **What does NOT qualify** (save for after breakdown):
   - Implementation details (library choices, naming, file structure)
   - Edge cases and error handling specifics
   - Test strategy details

   **If you identify 1-3 questions**: Surface them briefly before presenting the
   breakdown command. Keep it concise — the goal is a 30-second confirmation,
   not a design review.

   **If nothing to surface** (the common case for well-specified issues):
   Proceed directly to the breakdown.

6. **🔍 BREAKDOWN** (⚠️ IMPORTANT - DO NOT SKIP):

   **⚠️ CRITICAL: If --worktree flag was present, you should NEVER reach this
   point**

   **PAUSE HERE - Before ANY implementation planning or branch creation:**
   - Determine the best breakdown type (feature vs technical)
   - **Present the breakdown command** to the user for confirmation
   - See section 4.1 below for the full flow
   - **Run the breakdown command** after user confirms
   - **WAIT for breakdown to complete** before proceeding to step 7

   This step ensures thorough analysis of requirements, dependencies, test
   planning, and expert review BEFORE starting work.

7. **Create feature branch** (skip if --on-worktree or --in-container flag):

   If `--on-worktree` or `--in-container` flag is present:
   - Skip branch creation (already in worktree/container with dedicated branch)
   - Verify we're not on main branch: `git branch --show-current`
   - For `--in-container`: Also verify container metadata exists at
     `/workspace/.container-metadata.json`
   - Continue to next step

   Otherwise, for single issue:

   ```bash
   # Fetch issue title for branch naming
   ISSUE_TITLE=$(gh issue view <issue_number> --json title -q .title)

   # Use the same smart branch naming function (defined earlier in script)
   BRANCH_NAME=$(create_smart_branch_name "<issue_number>" "$ISSUE_TITLE")
   git checkout -b "$BRANCH_NAME"
   ```

   Example: `feature/123-invoice-pdf-export` or
   `feature/456-absence-webhook-management-api`

   **Note**: Branch names use intelligent keyword extraction to stay under Git's
   63-character recommendation while keeping the most meaningful words.

   For multiple issues:

   ```bash
   # For multiple issues, use abbreviated format
   # Format: feature/123-124-125-brief
   ISSUES_STRING="<issue1>-<issue2>-<issue3>"

   # Get first issue title or create combined description
   FIRST_TITLE=$(gh issue view <issue1> --json title -q .title)

   # For multi-issue branches, create very brief description
   PREFIX="feature/${ISSUES_STRING}-"
   AVAILABLE=$((63 - ${#PREFIX}))

   # Extract 2-3 most important keywords (portable pattern for BSD/GNU sed)
   CLEAN_TITLE=$(echo "$FIRST_TITLE" | tr '[:upper:]' '[:lower:]')
   # Remove common words using portable approach
   for word in the and or for with from implementation implement feature update add fix create; do
     CLEAN_TITLE=$(echo "$CLEAN_TITLE" | sed -E "s/(^| )$word( |$)/ /g" | sed 's/  */ /g')
   done
   KEYWORDS=$(echo "$CLEAN_TITLE" | tr -s ' ' '\n' | head -3 | tr '\n' '-' | sed 's/-$//')

   # Truncate if needed
   BRIEF=$(echo "$KEYWORDS" | cut -c1-$AVAILABLE)
   git checkout -b "feature/$ISSUES_STRING-$BRIEF"
   ```

   Example: `feature/123-124-125-auth-system-refactor`

8. **Comment on issue(s)**:

   ```bash
   # Comment on each issue being implemented
   # For regular branch:
   gh issue comment <issue_number> --body "🤖 Claude Code has started implementing this issue on branch \`feature/123-invoice-pdf-export\`"

   # For worktree implementation:
   gh issue comment <issue_number> --body "🤖 Claude Code has started implementing this issue in worktree \`feature/123-user-authentication\`"

   # For container implementation:
   gh issue comment <issue_number> --body "🤖 Claude Code has started implementing this issue in container \`dev-project-issue-123\` on branch \`feature/123-user-authentication\`"
   ```

### 4. Implementation Planning

#### 4.1 🔍 Breakdown Decision Point (⚠️ CRITICAL - ALWAYS ASK)

**⚠️ REMINDER: This section should NEVER be reached if --worktree flag was
present**

**MANDATORY PAUSE**: Before creating ANY implementation plan, you MUST pause and
present the breakdown command to the user. This is NOT optional.

**Exception: If --worktree flag was in the original command, you should have
already exited at section 1.5 and never reached this point.**

**🚨 CRITICAL: A breakdown file is ALWAYS created** - it serves as the progress
tracking document throughout implementation. The breakdown command always runs
at full depth. The breakdown `--light` flag is a user choice — never suggest or
default to it. (This is distinct from preflight's `--light` mode, which may be
conditionally suggested in the next-steps output.)

**How to present the breakdown command:**

1. Analyze the issue to determine the best breakdown type (see guidance below)
2. Present the command for the user to confirm or adjust:

```
📋 Before implementation, I'll run a breakdown to plan and track progress.

Based on [brief reason], I recommend:

/project:issues:[breakdown-type] #[issue]

This creates a tracking document at `docs/plans/YYYY-MM-DD-issue-[NUMBER]-...-breakdown.md`
with full analysis, dependency ordering, test planning, and expert review.

**Test coverage level** (optional, default: standard):
- `--tests none` - Skip test planning (spikes, prototypes)
- `--tests light` - Critical path tests only
- `--tests standard` - Balanced coverage [Default]
- `--tests thorough` - Comprehensive with E2E, edge cases

Ready to proceed, or would you like to adjust?
```

**When to recommend specific test levels**:

- `--tests none`: Quick spikes, throwaway prototypes, exploration
- `--tests light`: Simple bug fixes, minor UI tweaks, tight deadlines
- `--tests standard`: Most production work (default)
- `--tests thorough`: Payment flows, security features, public APIs, critical
  user journeys

**Which breakdown command?**

> **Will users see, experience, or interact with the result?**
>
> - **Yes → `breakdown-feature`** (even if requirements are settled, even if the
>   issue is mostly technical)
> - **No → `breakdown-technical`** (purely internal: migrations, refactoring,
>   infra)

> ⚠️ **Common Mistake**: Choosing `breakdown-technical` because requirements are
> "clear" or "settled." The deciding factor is never requirement clarity — it's
> whether users are affected. A detailed issue with file paths, specs, and
> acceptance criteria is still a feature breakdown if users will see the result.

**Signals to detect:**

- Labels: `infrastructure`, `backend`, `devops`, `refactor` → technical
- Labels: `feature`, `enhancement`, `ux`, `ui-ux-boost` → feature
- Issue mentions UI, UX, user workflows, or visual changes → feature
- Issue is purely backend with no user-facing impact → technical

**When in doubt, prefer `breakdown-feature`.** The user-story lens validates
that planned work actually serves users well, even when requirements seem
settled.

**🚨 After user confirms - MANDATORY next step:**

1. **Run the breakdown command** - Execute the breakdown skill (always full
   depth, never add `--light` unless the user explicitly requested it):
   `/project:issues:[breakdown-type] #[issue]`
2. **Verify file was created** - Check that the breakdown file exists in
   `docs/plans/`
3. **Only then proceed** to section 4.2

#### 4.2 Implementation Plan

After running the breakdown command (light or full) and the breakdown file is
created, present a plan in <plan> tags summarizing the approach.

For single issue:

```
<plan>
Based on issue #123 "Add PDF export for invoices", I will:

For multiple issues:
```

<plan>
Implementing issues #123, #124, #125 together:

Issue #123: "Backend API for auth" Issue #124: "Frontend login form" Issue #125:
"Auth middleware"

Implementation order (based on dependencies):

1. #125 - Auth middleware (foundation)
2. #123 - Backend API (uses middleware)
3. #124 - Frontend form (consumes API)

I will:

Custom context: "[Any implementation guidance provided]"

1. Install PDF generation library (jsPDF)
2. Create new API endpoint: POST /api/invoices/:id/export
3. Add PDF generation service with tests
4. Update Invoice component with export button
5. Add premium user check middleware
6. Write integration tests for the flow

Files to create/modify:

- package.json (add jsPDF)
- src/services/PdfService.js (new)
- src/api/invoices.js (modify)
- src/components/Invoice.jsx (modify)
- src/middleware/premium.js (new)
- tests/pdfExport.test.js (new)

Approach follows existing patterns for:

- Service layer organization
- API route structure
- Component composition
- Test structure

[If custom context provided, acknowledge it:] Per your guidance to "use the new
auth system", I'll integrate with the JWT middleware instead of the legacy
session approach. </plan>

````

Wait for human approval before proceeding.

### 4.9 Update Workflow Status

```bash
mkdir -p .workflow && echo '{"phase":"Implementation in progress","command":"implement","startedAt":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}' > .workflow/status.json
```

### 5. Implementation

1. **Write minimal tests first**:
   - Create test structure for main functionality
   - Focus on happy path initially
   - Tests serve as specification

2. **Implement the feature**:
   - Follow the approved plan
   - Write clean, documented code
   - Follow CLAUDE.md rules and `.claude/rules/` guidance
   - Make atomic commits with clear messages:
     ```bash
     git add [files]
     git commit -m "feat: Add PDF generation service for invoices"
     ```
   - Always include the breakdown file (`docs/plans/`) in commits — it is a
     living document that must stay in sync with the implementation

3. **Phase completion checkpoint** (MANDATORY after each phase):

   When you finish a phase from the breakdown plan, do ALL of the following
   **proactively** — do not wait for the user to ask "where are we?":

   a) **Update the breakdown plan immediately**:
      - Mark completed stories/enablers with ✅
      - Update progress table and "Current Focus" section
      - Record decisions made or scope changes during the phase
      - Commit the updated breakdown file

   b) **Check for quality gate**: Consult the breakdown's 🧪 Testing
      Checkpoints table. If this phase has 🚦 Gate = Yes or Final, present a
      **quality gate summary** to the user:

      ```
      🚦 Phase [N] Complete — Quality Gate

      **Breakdown plan**: Updated ✅

      **What's now testable:**
      - [Stories/features that became user-visible in this phase]

      **Validate now (structural decisions affecting later phases):**
      - [Items from the quality gate details section of the breakdown]

      **Deferred to final walkthrough:** [Polish items]

      **What would you like to do?**
      1. I'll test it myself (here's what to check)
      2. Run a Playwright check
      3. Continue to Phase [N+1]
      ```

      **Wait for the user's response** before continuing to the next phase.
      Structural decisions caught now cost minutes to fix; the same decisions
      caught two phases later can mean rewriting entire components.

      If the user chooses to test themselves, provide specific setup steps
      (e.g., "start the dev server", "navigate to X page") and exactly which
      screens/interactions to verify.

   c) **Non-gate phase completions**: A brief status note, then continue:

      ```
      ✅ Phase [N] complete ([what was built]).
      Breakdown plan updated. Moving to Phase [N+1]...
      ```

4. **Expand test coverage**:
   - Add edge case tests
   - Test error conditions
   - Ensure all acceptance criteria have tests
   - Run test suite:
     ```bash
     npm test
     ```

5. **Code quality checks**:
   - Run linter: `npm run lint`
   - Run formatter if configured
   - Check for console.logs or debug code
   - Verify no sensitive data exposed

### 6. Self-Review Checklist

Before creating PR, verify:
- [ ] All acceptance criteria from issue are met
- [ ] Tests pass locally
- [ ] Code follows project conventions
- [ ] No debugging artifacts left
- [ ] Changes are focused on the issue
- [ ] Documentation updated if needed
- [ ] Performance impact considered
- [ ] Security implications reviewed

### 6.5. Manual Testing Verification

**CRITICAL**: Before creating the PR, you MUST complete ALL manual tests from the issue. No PR should be created without executing the manual testing checklist.

1. **Locate the Manual Testing Checklist** in the issue description
   - Every issue should have a "Manual Testing Checklist" section
   - If missing, refer to the issue template and create one

2. **Execute EVERY test scenario** systematically:

   **DO NOT SKIP ANY TESTS** - Each checkbox must be checked with actual results:
   ```
   📋 Manual Testing Progress:

   ✅ Prerequisites
      - Test environment ready (used staging-clone DB)
      - Test user: testuser@example.com created
      - Tested on: Chrome 120, Firefox 121, Safari 17.2

   ✅ Core Functionality Tests
      - Studio owner invites teacher with message:
        Steps: 1) Login as owner 2) Go to /team 3) Click invite 4) Enter email
        Result: Email sent, invitation shows in list ✓
      - Cannot invite same email twice:
        Steps: 1) Try inviting test@example.com again
        Result: Error "Email already invited" shown ✓

   ✅ Edge Cases
      - Empty email field:
        Result: "Email is required" validation error ✓
      - Invalid email format:
        Input: "notanemail"
        Result: "Please enter a valid email" error ✓

   ✅ User Roles & Permissions
      - Studio Manager: Can view team page but not invite (tested) ✓
      - Teacher: Cannot access team page (redirects to /dashboard) ✓
      - Unauthenticated: Redirects to /login ✓

   ⚠️  Cross-Browser Testing
      - Chrome 120: ✓ All features working
      - Firefox 121: ✓ All features working
      - Safari 17.2: ⚠️ Invite button has minor alignment issue

   ✅ Error Recovery
      - Network disconnection during invite:
        Result: "Network error" toast, can retry ✓
      - Server 500 error simulation:
        Result: "Something went wrong" message ✓
   ```

3. **For each test you MUST document**:
   - **Exact steps taken** (not just "tested")
   - **Actual data/values used** (not placeholders)
   - **Specific results observed** (not just "works")
   - **Any deviations from expected** (even minor ones)

4. **Unacceptable test documentation**:
   ❌ "Tested login - works"
   ❌ "Edge cases handled"
   ❌ "All tests passing"

   **Required test documentation**:
   ✅ "Logged in with test@example.com, password Test123!, redirected to /dashboard in 1.2s"
   ✅ "Submitted empty form, saw 'Email is required' error below email field"
   ✅ "Invited same email twice, API returned 409, UI showed 'Already invited' toast"

5. **Capture evidence**:
   - Screenshots for ALL UI changes
   - Video recordings for multi-step flows
   - Network logs for API testing
   - Performance metrics with specific numbers

6. **Test result requirements**:
   - If ANY test fails → Fix before creating PR
   - If platform-specific issues exist → Document with screenshots
   - If performance is slow → Include specific metrics

7. **Update the PR description** with:
   - Copy of the completed manual testing checklist
   - Links to evidence (screenshots/videos)
   - Any deviations or known issues
   - Specific test data/accounts used

### 6. Finalize

1. **Run quality checks** (MANDATORY):
   ```bash
   # Check for test script and run tests
   npm test || pnpm test || yarn test

   # Check for typecheck script and run type checking
   npm run typecheck || pnpm typecheck || yarn typecheck

   # Check for lint script and run linting with auto-fix
   npm run lint || pnpm lint || yarn lint
   ```

   **Note**: Check package.json for the exact script names. Common variations:
   - Type checking: `typecheck`, `type-check`, `tsc`, `check-types`
   - Linting: `lint`, `lint:fix`, `eslint`, `fix`
   - Testing: `test`, `test:unit`, `jest`

   If any of these fail, fix the issues before proceeding.

2. **Provide implementation summary**:

   ```
   ✅ Implementation complete for issue #[issue_number]
   📝 Branch: feature/[issue_number]-[description]

   Quality checks:
   ✅ All tests passing
   ✅ Type checking passed
   ✅ Linting passed (auto-fixed any issues)
   📊 Coverage: [coverage_percentage]%

   Key changes implemented:
   - [Brief bullet point of main change 1]
   - [Brief bullet point of main change 2]
   - [Brief bullet point of main change 3]

   👀 Worth a human look:
   - [Anything that automated checks can't verify]
   ```

   **The "worth a human look" section**: Think about what parts of the
   implementation would benefit from human validation — things that tests and
   linting can't catch. This is not a fixed list; use your judgment based on
   what you built. Common examples:

   - **Business logic**: "Verify the cancellation grace period matches product
     intent (currently 24h)"
   - **UX/frontend**: "Check the empty state layout on mobile" or "Verify the
     error toast feels right"
   - **Data correctness**: "Confirm the migration output looks correct for
     existing records"
   - **Edge cases you're unsure about**: "The timezone handling for DST
     transitions — worth a manual check"
   - **Permissions/access**: "Verify tenant B truly can't see tenant A's data
     in the UI"

   If the implementation is purely mechanical (renaming, config changes, adding
   a straightforward test) and you genuinely think there's nothing worth
   flagging, skip the section. But most feature work has at least one thing.

## Common Patterns

### API Endpoint

```javascript
// Follow existing route patterns
router.post(
  '/invoices/:id/export',
  authenticate,
  requirePremium,
  async (req, res) => {
    // Implementation
  }
)
```

### Service Layer

```javascript
// Maintain service consistency
class PdfService {
  async generateInvoicePdf(invoice) {
    // Business logic here
  }
}
```

### React Component Updates

```jsx
// Use existing component patterns
{
  user.isPremium && (
    <Button onClick={handleExport} icon={<DownloadIcon />}>
      Export PDF
    </Button>
  )
}
```

## Error Handling

- **Issue not found**: Verify issue number and repo
- **Branch conflicts**: Pull latest main and rebase
- **Test failures**: Debug and fix before proceeding
- **Linting errors**: Fix all before committing

## Success Output

For single issue:

```
✅ Implementation complete for issue #123
📝 Branch: feature/123-invoice-pdf-export
✅ All tests passing
📊 Coverage: 95%

👀 Worth a human look:
- [If applicable — see guidance in section 6]
```

For multiple issues:

```
✅ Implementation complete for issues #123, #124, #125
📝 Branch: feature/123-124-125-auth-flow
✅ All tests passing
📊 Coverage: 95%

👀 Worth a human look:
- [If applicable — see guidance in section 6]
```

### Offer UI Critic (if UI changes were made)

After presenting the summary, check if the implementation included UI changes
(new/modified components, pages, or styles). If so, use AskUserQuestion to
offer running the ui-critic agent in the background while the user validates
the feature themselves:

- **"Run ui-critic in background"** — Spawn the ui-critic as a background
  Task with a contextual prompt (see below), then show next steps. The user
  can do their own walkthrough in parallel.
- **"Skip"** — Show next steps directly.

If the implementation is purely backend with no UI changes, skip this question
and go straight to next steps.

**Crafting the ui-critic prompt**: You have all the context needed from the
implementation — use it to give the critic orientation, not constraints:

- Which pages/routes to navigate to
- What's new or modified (so it knows what to focus on)
- What interactions and states are worth checking

But **don't over-constrain** — let it review the full page. Adding a new
section can shift the overall feel, create spacing inconsistencies with
existing elements, or reveal issues that were already there but are now more
noticeable. The critic should flag anything it sees, not just our changes.

Example prompt:

```
Navigate to http://localhost:3000/classes/[id]. We just added a
ClassTargetingTagsSection (tag badges, inline "+Add Tag" input, removal
dialog with warning). Review the full page with attention to:
- How the new section fits into the overall page layout and rhythm
- The new components specifically (badges, input, dialog)
- Accessibility: contrast, focus indicators, target sizes
- Any visual issues on the page, even if not directly related to our changes
Check both populated and empty states.
```

### Next Steps

After the ui-critic question (or skip), determine which preflight mode to
suggest.

**Suggest `--light`** if the implementation meets **all** of these:

- Issue has a `mechanical`, `bug`, or `sentry-issue` label
- Only 1–3 files were changed (excluding docs/plans/ files)
- No architectural or design decisions were made during implementation

Otherwise suggest the full preflight.

For small/mechanical changes:

```
Next steps:
1. Review the points above (if any) and validate the feature yourself
2. Run preflight check: /project:issues:preflight --light
3. Create PR: /project:issues:create-pr
4. Run review: /project:issues:review
```

For all other changes:

```
Next steps:
1. Review the points above (if any) and validate the feature yourself
2. Run preflight check: /project:issues:preflight
3. Create PR: /project:issues:create-pr
4. Run review: /project:issues:review
```

Additional output:

```
📝 Patterns noticed during implementation:

- [List any consistent patterns discovered during implementation]
- [E.g., "Always using useUser() hook for auth checks"]
- [E.g., "API routes follow /api/v1/[resource] pattern"]

Route these to the knowledge system: /project:knowledge:add
```

**Update workflow status**:

```bash
mkdir -p .workflow && echo '{"phase":"Ready for preflight","command":"implement","completedAt":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}' > .workflow/status.json
```

Remember: Focus on delivering working, tested code that solves the user's
problem. The PR creation is now a separate step, giving you time to review
and refine before submitting for code review.
````
