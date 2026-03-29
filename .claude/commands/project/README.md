# Project Commands

The project workflow commands are organized hierarchically by the type of object
they operate on. This structure makes it easy to discover related commands and
understand the workflow.

## GitHub CLI Reference

Many commands in this workflow use GitHub CLI (`gh`). For consistent and
reliable command usage, refer to:

- [`./github-cli-reference.md`](./github-cli-reference.md) - Comprehensive guide
  for all GitHub CLI patterns used in this workflow

## Command Structure

```
/project/
├── setup               # Initialize workflow structure
├── inception          # Create project from idea
├── stories/           # User story management
├── milestones/        # Sprint/phase planning
├── issues/            # GitHub issue operations
├── sentry/            # Error tracking and triage
└── knowledge/         # Knowledge management (rules, skills, docs)
```

## Quick Reference

### Project Setup

- `/setup-workflow` - Initialize workflow directories and files
- `/start-new-project "idea"` - Generate complete project documentation

### Story Management

- `/project:stories:create "description"` - Create new user story
- `/project:stories:activate "name"` - Move story to active development
- `/project:stories:complete "name"` - Archive completed story

### Milestone Planning

- `/project:milestones:suggest` - Analyze and suggest next milestones
- `/project:milestones:create "name"` - Create GitHub milestones

### Issue Operations

- `/project:issues:suggest "context"` - Suggest issues for milestone/feature
- `/project:issues:create "title"` - Create comprehensive GitHub issues
- `/project:issues:prioritize #123` - Set issue priorities
- `/project:issues:flesh-out #123` - Complete draft issues
- `/project:issues:update #123 "info"` - Update existing issues
- `/project:issues:implement #123` - Implement issues

### Error Tracking (Sentry)

- `/project:sentry:status` - Quick health check of all projects
- `/project:sentry:triage` - Review and categorize unresolved issues
- `/project:sentry:investigate ISSUE-ID` - Deep-dive into specific error
- `/project:sentry:fix ISSUE-ID` - Create GitHub issue and optionally fix

### Project Knowledge

- `/project:knowledge:add "pattern"` - Route knowledge to rules, skills,
  CLAUDE.md, or docs
- `/project:knowledge:improve` - Audit and refine existing knowledge artifacts

## Workflow Overview

1. **Start Project**: `/start-new-project "SaaS for X"`
2. **Create Stories**: `/project:stories:create "User needs Y"`
3. **Plan Sprints**: `/project:milestones:suggest`
4. **Create Work**: `/project:issues:create "Add feature"`
5. **Execute**: `/project:issues:implement #123`

## Philosophy

Commands are organized by what they operate on:

- **stories/** - File operations in story directories
- **milestones/** - GitHub milestone API operations
- **issues/** - GitHub issue API operations
- **knowledge/** - Knowledge management (rules, skills, docs)

This mirrors how developers think: "I want to work with stories" leads naturally
to `/project:stories:...`

## Getting Started

For new projects:

```
/setup-workflow
/start-new-project "Your project idea"
```

For ongoing work:

```
/project:milestones:suggest
/project:issues:create "New feature" --milestone "Sprint 1"
/project:issues:implement #123
```

See subdirectory READMEs for detailed command documentation.
