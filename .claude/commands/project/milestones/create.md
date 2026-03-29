# Create Milestones Command

You are a milestone creation assistant that takes user input and creates
well-structured GitHub milestones. You focus on clarity, avoiding duplicates,
and maintaining consistency with project goals.

## Prerequisites

1. Verify GitHub CLI is configured: `gh auth status`
2. Ensure you're in a git repository with GitHub remote
3. Ideally run `/project:milestones:suggest` first for context

## Command Input

<arguments>
#$ARGUMENTS
</arguments>

Parse arguments which can include:

- One or more milestone names (quoted strings)
- Optional flag `--context "additional details or guidance"`

Examples:

```
/project:milestones:create "Hello Production"
/project:milestones:create "MVP Launch" "Beta Testing"
/project:milestones:create "Authentication Flow" --context "Complete auth system with SSO support"
```

## Process

### 1. Parse Input

Extract from arguments:

- **Milestone names**: Each quoted string is a milestone to create
- **Context**: `--context` parameter provides additional guidance for
  description and scope
- Use context to inform milestone descriptions and ordering

### 2. Check Existing Milestones

Before creating, check what already exists:

```bash
# Get all milestones (open and closed)
gh api repos/:owner/:repo/milestones --paginate --jq '.[] | {title, state, number, open_issues, closed_issues}'
```

For each proposed milestone:

- Check if a milestone with similar name already exists
- If exists and open: Skip creation, notify user
- If exists and closed: Ask if they want to reopen or create new

### 3. Gather Context

For each milestone to create:

1. **Review project docs**:
   - Check `docs/product/ROADMAP.md` for relevant phases
   - Look at `docs/story-map.md` for related features
   - Understand the project's current state

2. **Generate descriptions** (using context if provided):
   - Brief overview of what the milestone encompasses
   - 3-5 key deliverables
   - Success criteria
   - Incorporate any specific requirements from --context

3. **Focus on logical ordering**:
   - Consider dependencies between milestones
   - Think about which should be tackled first
   - Note prerequisites in descriptions

### 4. Confirm Before Creation

Present what will be created:

```
📋 Ready to create 2 milestones:

1. "Hello Production"
   Description: Get the application deployed and accessible
   Key deliverables:
   - CI/CD pipeline setup
   - Staging environment
   - Production deployment
   - Domain configuration
   Order: Should be completed first (foundation work)

2. "MVP Launch"
   Description: Core features ready for first users
   Key deliverables:
   - User authentication
   - Basic CRUD operations
   - Error handling
   - Initial documentation
   Order: Depends on "Hello Production" completion

Create these milestones? (Y/n/edit):
```

### 5. Create Milestones

For each confirmed milestone:

```bash
# Create via GitHub API
gh api repos/:owner/:repo/milestones \
  --method POST \
  --field title="[Milestone Name]" \
  --field description="[Generated or provided description]"
```

Handle any errors:

- Duplicate name: Skip and note
- API errors: Retry once, then report
- Missing milestone name: Show error with examples

### 6. Post-Creation Actions

After successful creation:

```
✅ Created milestones:

1. "Hello Production" (#5)
   🔗 https://github.com/:owner/:repo/milestone/5

2. "MVP Launch" (#6)
   🔗 https://github.com/:owner/:repo/milestone/6

📊 Current milestone summary:
- Active: 4 milestones
- Total issues: 23 open, 45 closed

🎯 Next steps:
1. Populate with issues: /project:issues:suggest "For milestone Hello Production"
2. Or create specific issues: /project:issues:create "Deploy pipeline" --milestone "Hello Production"
3. View in GitHub: gh milestone list
```

## Input Handling

### Single Milestone

```
/project:milestones:create "Q1 Features"
```

### Multiple Milestones

```
/project:milestones:create "Authentication" "Payment Integration" "Admin Dashboard"
```

### With Description

```
/project:milestones:create "Beta Release" --description "Feature complete beta for user testing"
```

### From Suggestions

After running suggest-milestones:

```
/project:milestones:create "Hello Production" "Foundation + Auth"
```

## Smart Features

1. **Duplicate Detection**:
   - Fuzzy match milestone names
   - Suggest existing milestone if very similar

2. **Description Enhancement**:
   - Even with provided descriptions, add structure
   - Include deliverables list
   - Add success criteria

3. **Logical Flow**:
   - Suggest natural progression order
   - Identify dependencies between milestones
   - Note which milestone to populate first

4. **Linking Suggestions**:
   - After creation, suggest related actions
   - Mention relevant documentation
   - Connect to existing stories/issues

## Error Handling

- **No arguments**: Show usage examples
- **Missing description**: Generate from milestone name
- **Duplicate milestone**: Show existing one, ask for new name
- **API failure**: Provide manual creation command
- **Not in git repo**: Guide to correct directory

## Examples

### Quick Creation

```
/project:milestones:create "MVP"
# Creates with auto-generated description
```

### Detailed Creation

```
/project:milestones:create "Payment System" --description "Complete payment processing with Stripe integration, including subscriptions and invoicing"
```

### Batch Creation from Planning

```
# After team planning session
/project:milestones:create "Development Foundation" "Authentication Core" "First User Feature"
```

Remember: Milestones are organizational tools. Keep them focused, achievable,
and aligned with your roadmap. Each milestone should deliver clear value that
moves the project forward.
