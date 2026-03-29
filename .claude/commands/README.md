# Workflow Commands Guide

This directory contains all workflow automation commands. Each command is a
markdown file that provides instructions to AI assistants.

## Important Guidelines for AI Assistants

### Command Execution

- **NEVER** attempt to execute .md files directly as bash scripts
- **ALWAYS** use slash commands to invoke workflow commands
- Example: `/project:issues:create "Title"` not `bash ./create.md`

### Command Chaining

When one command needs to trigger another:

1. Output the slash command for the user to run
2. Example: "To prioritize this issue, run: `/project:issues:prioritize #123`"
3. Do NOT try to execute the other command directly

### File References

When commands reference other commands:

- Use relative paths: `./create.md` (in same directory)
- Check file existence before proceeding
- Fail gracefully with helpful error messages

### Project Structure

Commands expect this structure:

```
.
├── PLATFORM.md        # Strategic principles, domain context
├── CLAUDE.md          # Non-negotiable rules
├── .claude/
│   ├── commands/      # Command definitions
│   ├── rules/         # Path-scoped coding guardrails
│   └── skills/        # On-demand workflow knowledge
├── docs/              # Project documentation
│   └── user-stories/
└── .github/           # GitHub configuration
```

### GitHub CLI Reference

Many workflow commands use GitHub CLI (`gh`). For consistent command usage:

- See [`project/github-cli-reference.md`](project/github-cli-reference.md) for
  all GitHub CLI patterns
- Always check this reference when implementing or debugging commands

## Command Categories

### Project Management

- `/setup-workflow` - Initialize workflow structure
- `/start-new-project` - New project planning
- `/onboard-existing-project` - Add workflow to existing project

### Milestone Management

- `/project:milestones:suggest` - Analyze and suggest milestones
- `/project:milestones:create` - Create GitHub milestones

### Issue Management

- `/project:issues:suggest` - Analyze and suggest issues
- `/project:issues:create` - Create comprehensive issues
- `/project:issues:breakdown` - Break down into value-driven user stories
- `/project:issues:update` - Update existing issues
- `/project:issues:flesh-out` - Complete draft issues
- `/project:issues:prioritize` - Set issue priorities
- `/project:issues:implement` - Implement approved issues

### Story Management

- `/project:stories:suggest` - Analyze and suggest user stories
- `/project:stories:create` - Create user stories
- `/project:stories:activate` - Move story to active
- `/project:stories:complete` - Archive completed story

### Knowledge Management

- `/project:knowledge:add` - Route knowledge to the right dimension (rules,
  skills, CLAUDE.md, docs)

## Creating New Commands

All command files follow this standard structure:

```markdown
# [Command Name] Command

You are a [role] that [primary purpose]. You [key behaviors].

**IMPORTANT: [Any critical warnings or non-negotiable behaviors]**

## Prerequisites

1. Check [requirement 1]
2. Verify [requirement 2]
3. Load [necessary context files]

## Command Input

<arguments>
#$ARGUMENTS
</arguments>

Parse arguments which can include:

- **[Main argument]** (required) - Description
- Optional parameters:
  - `--flag "value"` - What this does
  - `--another-flag` - What this enables

Examples:
```

/namespace:command "main argument" /namespace:command "arg1" "arg2" --flag
"value" /namespace:command "something" --flag1 --flag2

```

## Process

[Command-specific implementation details go here - could be numbered steps, subsections, or whatever structure makes sense for this command]
```

## Common Patterns

### Suggest → Create Flow

Works for milestones, issues, and stories:

1. User runs suggest command for analysis
2. AI provides formatted suggestions
3. User copies/modifies suggestions
4. User runs create command with refined input

### Issue Lifecycle

1. **Create** - Create issue with research built-in or just draft with `--draft`
2. **Flesh-out** - Enhance draft issue with research
3. **Prioritize** - Auto-apply priority labels based on roadmap
4. **Human Review** → Human moves to "Ready" status if it's ready for
   implementation
5. **Implement** → Auto-moves to "In Progress" and starts implementing
6. **PR** → Preflight (compliance + quality) → Review → Merge → "Done"

### Story Lifecycle

1. **Suggest** - Analyze codebase for story ideas
2. **Create** - Define user story in backlog
3. **Activate** - Move to active development
4. **Create issues** - Break down into tasks
5. **Complete** - Archive when all issues done

### Workflow Evolution

1. Start with `/start-new-project` for new projects
2. Or `/onboard-existing-project` for existing codebases
3. Project knowledge accumulates via `/project:knowledge:add` (routes to rules,
   skills, or CLAUDE.md)
