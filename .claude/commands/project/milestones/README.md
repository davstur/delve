# Milestone Commands

Commands for planning and creating GitHub milestones to organize work into
focused sprints.

## GitHub CLI Reference

These commands use GitHub CLI (`gh`) for milestone operations. For API patterns
and troubleshooting:

- [`../github-cli-reference.md`](../github-cli-reference.md) - Complete GitHub
  CLI reference for this workflow

## Available Commands

### `/project:milestones:suggest`

Analyzes project state and suggests logical next milestones.

**Usage:**

```
/project:milestones:suggest
/project:milestones:suggest "Focus on B2B features"
```

**Arguments:**

- Context (optional) - Additional guidance for suggestions

**Process:**

- Reviews existing milestones
- Analyzes ROADMAP.md and current issues
- Suggests 2-3 next logical phases
- No side effects (discussion only)

**Output Example:**

```
🚀 Suggested: "Hello Production"
   Get the basic app deployed
   - Why now: Core features ready, need deployment
   - Deliverables: CI/CD, staging, monitoring

📍 Suggested: "Authentication Core"
   Complete auth system
   - Why now: Blocks all user features
   - Deliverables: Login, signup, roles
```

---

### `/project:milestones:create`

Creates one or more GitHub milestones.

**Usage:**

```
/project:milestones:create "MVP Launch"
/project:milestones:create "Auth" "Payments" "Admin"
/project:milestones:create "MVP" --context "Core features for first users"
```

**Arguments:**

- Milestone names (required) - One or more quoted names

**Flags:**

- `--context "text"` - Additional context to guide milestone scope and
  description

**Process:**

- Checks for duplicates
- Creates via GitHub API
- Generates descriptions if not provided
- Links to relevant documentation

## Milestone Philosophy

- **No dates** - Focus on logical progression, not deadlines
- **Clear deliverables** - Each milestone has concrete outcomes
- **Small batches** - Prefer focused milestones over sprawling epics
- **User value** - Each milestone delivers something visible

## Integration with Issues

After creating milestones:

```
# Suggest issues for the milestone
/project:issues:suggest "For milestone Hello Production"

# Create issues linked to milestone
/project:issues:create "Deploy app" --milestone "Hello Production"

# Implement all issues in milestone
/project:issues:implement --milestone "Hello Production"
```

## Best Practices

1. Create milestones during sprint planning
2. Keep milestones achievable (5-15 issues)
3. Name clearly: "User Authentication" not "Sprint 3"
4. Review progress with `gh milestone list`
5. Close milestones when all issues complete
