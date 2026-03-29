# /project:stories:suggest

Analyze discovery findings and suggest user stories for implementation.

## Usage

```bash
# From discovery issues
/project:stories:suggest --from-issues "69,70,71"

# From general context
/project:stories:suggest "Based on FDS discovery findings"

# Filter by user type
/project:stories:suggest --from-issues "69,70,71" --user-type "teacher"
```

## What it does

1. **Gathers discovery findings** from:
   - Issue descriptions and comments
   - Linked PR documentation
   - General context provided

2. **Identifies key elements**:
   - User types and roles
   - Workflows and processes
   - Pain points and needs
   - Business requirements

3. **Suggests user stories** with:
   - Clear titles
   - Classic story format
   - Connection to findings
   - Priority recommendations

4. **Checks for duplicates** in existing stories

## Options

- `--from-issues`: Comma-separated issue numbers to analyze
- `--user-type`: Filter suggestions by specific user type

## Example

```bash
/project:stories:suggest --from-issues "69,70,71"

# Output:
📝 Suggested User Stories:

1. "Teacher: Quick class attendance marking"
   As a teacher, I want to mark attendance for my entire class in under 2 minutes,
   so that I can focus on teaching instead of administration.

   From findings: Currently takes 10+ minutes in Excel (#69)
   Priority: High (addresses main pain point)

📋 Next steps:
- Create story: /project:story "Teacher: Quick class attendance marking"
```

---

## Implementation

```bash
#!/bin/bash

# Parse arguments
FROM_ISSUES=""
USER_TYPE=""
CONTEXT=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --from-issues)
            FROM_ISSUES="$2"
            shift 2
            ;;
        --user-type)
            USER_TYPE="$2"
            shift 2
            ;;
        *)
            CONTEXT="$*"
            break
            ;;
    esac
done

# Gather discovery content
DISCOVERY_CONTENT=""

if [ -n "$FROM_ISSUES" ]; then
    echo "🔍 Analyzing discovery issues: $FROM_ISSUES"

    # Split comma-separated issues and gather content
    IFS=',' read -ra ISSUES <<< "$FROM_ISSUES"
    for issue in "${ISSUES[@]}"; do
        echo "  - Gathering findings from issue #$issue"

        # Use gh to get issue content
        ISSUE_CONTENT=$(gh issue view "$issue" --json title,body,comments 2>/dev/null || echo "")
        if [ -n "$ISSUE_CONTENT" ]; then
            DISCOVERY_CONTENT="$DISCOVERY_CONTENT

Issue #$issue:
$ISSUE_CONTENT"
        fi

        # Check for linked PRs and their documentation
        PR_REFS=$(gh issue view "$issue" --json body,comments -q '.body, .comments[].body' | grep -oE "Fixed by #[0-9]+" | grep -oE "[0-9]+" || true)
        for pr in $PR_REFS; do
            echo "  - Checking PR #$pr for documentation"
            PR_FILES=$(gh pr view "$pr" --json files -q '.files[].path' 2>/dev/null || echo "")
            if [ -n "$PR_FILES" ]; then
                DISCOVERY_CONTENT="$DISCOVERY_CONTENT

PR #$pr files: $PR_FILES"
            fi
        done
    done
else
    DISCOVERY_CONTENT="$CONTEXT"
fi

# Check existing stories to avoid duplicates
echo ""
echo "📚 Checking existing stories..."
EXISTING_STORIES=""
if [ -d "docs/user-stories" ]; then
    EXISTING_STORIES=$(find docs/user-stories -name "*.md" -type f | xargs grep -h "^#" | grep -v "^##" || echo "")
fi

# AI prompt for story generation
AI_PROMPT="Based on the following discovery findings, suggest user stories that would address the identified needs.

Discovery Content:
$DISCOVERY_CONTENT

Existing Stories (to avoid duplicates):
$EXISTING_STORIES

Requirements:
1. Generate 3-5 user stories based on the findings
2. Use the format: 'As a [user], I want [capability], so that [benefit]'
3. Include clear titles in the format: '[User Type]: [Action/Capability]'
4. Connect each story to specific findings
5. Suggest priority (High/Medium/Low) based on impact
6. Check against existing stories to avoid duplicates
"

if [ -n "$USER_TYPE" ]; then
    AI_PROMPT="$AI_PROMPT
7. Focus specifically on stories for: $USER_TYPE"
fi

AI_PROMPT="$AI_PROMPT

Output format:
📝 Suggested User Stories:

1. \"[Title]\"
   As a [user], I want [capability],
   so that [benefit].

   From findings: [specific reference]
   Priority: [High/Medium/Low] ([reasoning])

[Continue for each story...]

📋 Next steps:
- Create story: /project:story \"[Title]\"
- Or create all: /project:story \"[Title1]\" \"[Title2]\" ..."

# Generate suggestions
echo ""
echo "🤖 Generating story suggestions..."
echo ""
echo "$AI_PROMPT"
```
