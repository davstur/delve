# GitHub CLI Reference

This is a reference guide for GitHub CLI commands commonly used in the workflow.
This is not a command to execute - it's a reference to consult when using other
commands.

## Purpose

This reference ensures consistent GitHub CLI usage across all workflow commands.
When implementing or modifying workflow commands that use `gh`, consult this
reference for:

- Correct command syntax
- Error handling patterns
- Common pitfalls to avoid
- Best practices for reliability

**Important**: All workflow commands that use GitHub CLI should reference this
document to maintain consistency.

## Common Discovery Patterns

**Always check what's available before using it:**

### Labels

```bash
# List all available labels with descriptions
gh label list --json name,description -q '.[] | "\(.name): \(.description)"'

# List just label names
gh label list --json name -q '.[].name'

# Check if a specific label exists
gh label list --json name -q '.[].name' | grep -q "^enhancement$" && echo "exists" || echo "not found"

# Create a label if it doesn't exist
gh label create "enhancement" --description "New feature or request" --color "0052CC"
```

### Milestones

```bash
# List all milestones (there is no 'gh milestone' command)
gh api repos/:owner/:repo/milestones --jq '.[] | "\(.title) - \(.state)"'

# List only open milestones
gh api repos/:owner/:repo/milestones?state=open --jq '.[].title'

# Check if milestone exists
gh api repos/:owner/:repo/milestones --jq '.[] | select(.title == "Hello Production") | .title'

# Create a new milestone
gh api repos/:owner/:repo/milestones \
  -X POST \
  -f title="Milestone Name" \
  -f description="Milestone description" \
  -f due_on="2024-12-31T00:00:00Z"
```

### Issues

```bash
# View issue details
gh issue view <number> --json title,body,labels,milestone,state

# Edit issue body
gh issue edit <number> --body "new content"

# Add label to issue
gh issue edit <number> --add-label "label-name"

# Remove label from issue
gh issue edit <number> --remove-label "label-name"

# List issues with various filters
gh issue list --milestone "milestone-name" --json number,title,state
gh issue list --state closed --search "keywords" --limit 10
gh issue list --state all --search "keywords"
gh issue list --state open --json number,title,labels --jq '.[] | select(.milestone == null)'

# Comment on issue
gh issue comment <number> --body "comment text"
```

### Projects

```bash
# Get repository owner and name
OWNER=$(gh repo view --json owner -q .owner.login)
REPO=$(gh repo view --json name -q .name)

# List all projects for the owner
gh project list --owner "$OWNER" --format json

# Get project number (usually the first/only project)
PROJECT_NUMBER=$(gh project list --owner "$OWNER" --format json | jq -r '.projects[0].number')

# Or get a specific project by title
PROJECT_NUMBER=$(gh project list --owner "$OWNER" --format json | jq -r '.projects[] | select(.title == "Project Title") | .number')

# List items in a project
gh project item-list "$PROJECT_NUMBER" --owner "$OWNER" --format json

# Get an issue's status in the project
# Note: .status only appears when issue has been moved from "No Status"
gh project item-list "$PROJECT_NUMBER" --owner "$OWNER" --format json | \
  jq -r '.items[] | select(.content.number == 123) | .status // "No Status"'

# List project fields (to get field IDs)
gh project field-list "$PROJECT_NUMBER" --owner "$OWNER" --format json
```

### Issue Relationships (GraphQL)

GitHub's native issue relationships require GraphQL. These provide parent/child
and blocking relationships visible in the GitHub UI.

**Important**: Sub-issue queries require a feature header:
`-H "GraphQL-Features: sub_issues"`

```bash
# Get issue node ID (required for GraphQL mutations)
gh api graphql -f query='
{
  repository(owner: "OWNER", name: "REPO") {
    issue(number: 123) { id }
  }
}'

# Add parent/child (sub-issue) relationship
gh api graphql -f query='
mutation($parentId: ID!, $childId: ID!) {
  addSubIssue(input: {
    issueId: $parentId
    subIssueId: $childId
  }) {
    issue { number title }
    subIssue { number title }
  }
}' -f parentId="I_kwDO..." -f childId="I_kwDO..."

# Remove sub-issue relationship
gh api graphql -f query='
mutation($parentId: ID!, $childId: ID!) {
  removeSubIssue(input: {
    issueId: $parentId
    subIssueId: $childId
  }) {
    issue { number }
  }
}' -f parentId="I_kwDO..." -f childId="I_kwDO..."

# List sub-issues of a parent
gh api graphql -H "GraphQL-Features: sub_issues" -f query='
{
  repository(owner: "OWNER", name: "REPO") {
    issue(number: 123) {
      subIssues(first: 10) {
        nodes { number title }
      }
      subIssuesSummary {
        total
        completed
        percentCompleted
      }
    }
  }
}'

# Get parent issue of a sub-issue
gh api graphql -H "GraphQL-Features: sub_issues" -f query='
{
  repository(owner: "OWNER", name: "REPO") {
    issue(number: 456) {
      parent {
        number
        title
        body
      }
    }
  }
}'

# Add blocking relationship (issueId is blocked BY blockingIssueId)
gh api graphql -f query='
mutation($blockedId: ID!, $blockerId: ID!) {
  addBlockedBy(input: {
    issueId: $blockedId
    blockingIssueId: $blockerId
  }) {
    issue { number title }
    blockingIssue { number title }
  }
}' -f blockedId="I_kwDO..." -f blockerId="I_kwDO..."

# Remove blocking relationship
gh api graphql -f query='
mutation($blockedId: ID!, $blockerId: ID!) {
  removeBlockedBy(input: {
    issueId: $blockedId
    blockingIssueId: $blockerId
  }) {
    issue { number }
  }
}' -f blockedId="I_kwDO..." -f blockerId="I_kwDO..."

# Query blocking relationships for an issue
gh api graphql -f query='
{
  repository(owner: "OWNER", name: "REPO") {
    issue(number: 123) {
      blocking(first: 10) { nodes { number title } }
      blockedBy(first: 10) { nodes { number title } }
    }
  }
}'
```

**Note**: Use native GitHub relationships for all dependency tracking. The
dependency graph in the GitHub UI shows these relationships automatically.

### Practical Patterns for Issue Relationships

**Getting node IDs efficiently:**

```bash
# Get node ID for a single issue
gh api graphql -f query='{ repository(owner: "OWNER", name: "REPO") { issue(number: 123) { id } } }' --jq '.data.repository.issue.id'

# Get node IDs for multiple issues (batch)
for num in 100 101 102 103; do
  echo -n "$num: "
  gh api graphql -f query="{ repository(owner: \"OWNER\", name: \"REPO\") { issue(number: $num) { id } } }" --jq '.data.repository.issue.id'
done
```

**Inline mutation (simpler for one-off operations):**

```bash
# Add blocking relationship - inline syntax (no variables)
# Note: issueId = the one that IS BLOCKED, blockingIssueId = the one DOING the blocking
gh api graphql -f query='mutation { addBlockedBy(input: { issueId: "I_kwDO...", blockingIssueId: "I_kwDO..." }) { issue { number } } }'

# Add sub-issue relationship - inline syntax
gh api graphql -f query='mutation { addSubIssue(input: { issueId: "I_kwDO_PARENT", subIssueId: "I_kwDO_CHILD" }) { subIssue { number } } }'
```

**Common pitfall - parameter naming:**

| Mutation       | Parameter         | Meaning                   |
| -------------- | ----------------- | ------------------------- |
| `addBlockedBy` | `issueId`         | The issue that IS blocked |
| `addBlockedBy` | `blockingIssueId` | The issue that blocks it  |
| `addSubIssue`  | `issueId`         | The parent issue          |
| `addSubIssue`  | `subIssueId`      | The child issue           |

Think of it as: "Issue X is blocked BY issue Y" →
`issueId: X, blockingIssueId: Y`

**Batch adding relationships after creating multiple issues:**

```bash
# After creating issues, add relationships in sequence
# Example: 715 blocks 716, 716 blocks 717

# 1. Get all node IDs
ID_715=$(gh api graphql -f query='{ repository(owner: "OWNER", name: "REPO") { issue(number: 715) { id } } }' --jq '.data.repository.issue.id')
ID_716=$(gh api graphql -f query='{ repository(owner: "OWNER", name: "REPO") { issue(number: 716) { id } } }' --jq '.data.repository.issue.id')
ID_717=$(gh api graphql -f query='{ repository(owner: "OWNER", name: "REPO") { issue(number: 717) { id } } }' --jq '.data.repository.issue.id')

# 2. Add relationships using inline mutations (more reliable than variable passing in bash)
gh api graphql -f query="mutation { addBlockedBy(input: { issueId: \"$ID_716\", blockingIssueId: \"$ID_715\" }) { issue { number } } }"
gh api graphql -f query="mutation { addBlockedBy(input: { issueId: \"$ID_717\", blockingIssueId: \"$ID_716\" }) { issue { number } } }"
```

### Pull Requests

```bash
# Create draft PR
gh pr create --draft \
  --title "PR title" \
  --body "PR description" \
  --assignee "@me"

# Mark PR as ready for review
gh pr ready <pr-number>

# List PRs for current branch
gh pr list --head $(git branch --show-current) --json number -q '.[0].number'
```

### Authentication

```bash
# Check authentication status
gh auth status

# Check if authenticated (for scripts)
gh auth status >/dev/null 2>&1 && echo "Authenticated" || echo "Not authenticated"
```

## Workflow Label Glossary

Standard labels used in this workflow:

### Priority Labels

- `critical 🔴` - Production down, security issues, blocks current milestone
- `high 🟠` - Needed for next milestone, high user value
- `medium 🟡` - Important but not urgent, can wait 1-2 months
- `low 🟢` - Future optimization, edge cases, can wait 3+ months

### Type Labels

- `✨ enhancement` - New feature or request
- `🐛 bug` - Something isn't working
- `⚙️ chore` - Technical work, docs, refactoring
- `👷‍♂️ manual` - Requires human action (no code)

### State Labels

- `📝 draft` - Needs more detail before implementation
- `❓ needs-clarification` - Requires human decision or input

### Area Labels (Optional)

Apply only when relevant for planning or expertise:

- `🏗️ infrastructure` - DevOps, deployment, CI/CD
- `🏎️ performance` - Speed, optimization, efficiency
- `🤺 security` - Auth, vulnerabilities, compliance
- `🎨 ui-ux-boost` - Optional feature enhancements and improvements to boost
  existing UI or UX
- `💸 tech-debt` - Code quality, refactoring, cleanup
- `💎 reliability` - Stability, validation, defensive programming

## Common Patterns

### Safe Issue Creation

```bash
# 1. First check if label exists
TYPE_LABEL="enhancement"
if gh label list --json name -q '.[].name' | grep -q "^${TYPE_LABEL}$"; then
  echo "Label exists"
else
  echo "Warning: Label '$TYPE_LABEL' not found. Using 'bug' instead."
  TYPE_LABEL="bug"
fi

# 2. Check if milestone exists (if provided)
if [ -n "$MILESTONE" ]; then
  MILESTONE_EXISTS=$(gh api repos/:owner/:repo/milestones --jq '.[] | select(.title == "'"$MILESTONE"'") | .title')
  if [ -z "$MILESTONE_EXISTS" ]; then
    echo "Warning: Milestone '$MILESTONE' not found. Creating without milestone."
    MILESTONE=""
  fi
fi

# 3. Create the issue
if [ -n "$MILESTONE" ]; then
  gh issue create \
    --title "Issue title" \
    --body "Issue description" \
    --label "$TYPE_LABEL" \
    --milestone "$MILESTONE"
else
  gh issue create \
    --title "Issue title" \
    --body "Issue description" \
    --label "$TYPE_LABEL"
fi
```

### Project Board Operations

**Configuration**: Projects are configured in `.workflow/config.json`:

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

- `project_number` (recommended): Direct access, faster
- `project_title`: Fallback for name matching

The owner is auto-detected from the repo's remote.

```bash
# Move issue to "In Progress" status
move_to_in_progress() {
  local issue_number=$1
  local owner=$(gh repo view --json owner -q .owner.login)

  # Get project data
  PROJECT_JSON=$(gh project list --owner "$owner" --format json)
  if [ "$(echo "$PROJECT_JSON" | jq -r '.projects | length')" = "0" ]; then
    echo "No project board found"
    return 1
  fi

  # Check for project_number in config (faster, direct access)
  if [ -f ".workflow/config.json" ]; then
    CONFIG_NUMBER=$(jq -r '.github.project_number // empty' .workflow/config.json 2>/dev/null)
    if [ -n "$CONFIG_NUMBER" ]; then
      PROJECT_NUMBER="$CONFIG_NUMBER"
      PROJECT_ID=$(echo "$PROJECT_JSON" | jq -r --argjson num "$PROJECT_NUMBER" '.projects[] | select(.number == $num) | .id')
    fi
  fi

  # Fall back to project_title or first project
  if [ -z "$PROJECT_NUMBER" ]; then
    PROJECT_NUMBER=$(echo "$PROJECT_JSON" | jq -r '.projects[0].number')
    PROJECT_ID=$(echo "$PROJECT_JSON" | jq -r '.projects[0].id')
  fi

  # Get item ID for the issue
  ITEM_ID=$(gh project item-list "$PROJECT_NUMBER" --owner "$owner" --format json | \
    jq -r ".items[] | select(.content.number == $issue_number) | .id")

  if [ -z "$ITEM_ID" ]; then
    echo "Issue not found on project board"
    return 1
  fi

  # Get field IDs
  STATUS_FIELD_ID=$(gh project field-list "$PROJECT_NUMBER" --owner "$owner" --format json | \
    jq -r '.fields[] | select(.name == "Status") | .id')
  IN_PROGRESS_ID=$(gh project field-list "$PROJECT_NUMBER" --owner "$owner" --format json | \
    jq -r '.fields[] | select(.name == "Status") | .options[] | select(.name == "In Progress") | .id')

  # Update status
  gh project item-edit \
    --id "$ITEM_ID" \
    --field-id "$STATUS_FIELD_ID" \
    --project-id "$PROJECT_ID" \
    --single-select-option-id "$IN_PROGRESS_ID"
}
```

## Error Recovery

When commands fail, use these patterns to diagnose:

### Label Errors

```bash
# Error: could not add label: 'discussion' not found
# Solution: List available labels first
gh label list --json name -q '.[].name' | sort
```

### Milestone Errors

```bash
# Error: could not add to milestone: 'Foundation + Auth' not found
# Solution: List available milestones
gh api repos/:owner/:repo/milestones --jq '.[] | "\(.title)"'
```

### Project Errors

```bash
# Error: No project board found
# Solution: Check project exists and issue is added
gh project list --owner "$(gh repo view --json owner -q .owner.login)"
```

## Best Practices

1. **Always discover before using** - Check labels, milestones, and projects
   exist
2. **Handle missing gracefully** - Provide fallbacks when things don't exist
3. **Use JSON output** - More reliable than parsing text output
4. **Check error codes** - Use `|| echo "default"` patterns for safety
5. **Batch operations** - Check multiple things at once to reduce API calls

## Common Mistakes to Avoid

- ❌ `gh milestone list` - This command doesn't exist
- ❌ Using labels without checking they exist first
- ❌ Assuming project board is configured
- ❌ Hard-coding owner names instead of discovering them
- ❌ Not handling empty results from queries
- ❌ Trying to set parent/blocking via REST API - requires GraphQL
- ❌ Using issue numbers instead of node IDs in GraphQL mutations

Remember: This reference helps ensure commands work reliably across different
repository configurations.
