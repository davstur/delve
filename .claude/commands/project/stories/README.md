# Story Commands

Commands for managing user stories throughout their lifecycle.

## Available Commands

### `/project:stories:create`

Creates a new user story in the backlog.

**Usage:**

```
/project:stories:create "Users need to export data as PDF"
/project:stories:create "Admin monitoring dashboard" --context "Enterprise priority for Q2"
```

**Arguments:**

- Story description (required) - Natural language description of the feature

**Flags:**

- `--context "text"` - Additional business context, priority, or relationships

**Process:**

- Refines into proper story format
- Incorporates context into scope and priority
- Checks for duplicates
- Saves to `docs/user-stories/backlog/`

---

### `/project:stories:activate`

Moves a story from backlog to active development.

**Usage:**

```
/project:stories:activate "export-pdf"
```

**Arguments:**

- Story name (required) - Filename without .md extension

**Process:**

- Validates story completeness
- Moves from `backlog/` to `active/`
- Suggests creating issues

---

### `/project:stories:complete`

Archives a completed story.

**Usage:**

```
/project:stories:complete "export-pdf"
```

**Arguments:**

- Story name (required) - Filename without .md extension

**Process:**

- Checks for open issues
- Adds completion metadata
- Moves from `active/` to `completed/`

## Story Lifecycle

```
create → backlog/ → activate → active/ → complete → completed/
```

## Integration Points

- **Active stories** can be referenced when creating issues with `--story` flag
- **Completed stories** serve as historical documentation
- **Story names** become issue context and PR references

## Best Practices

1. Keep stories user-focused (not technical tasks)
2. One story = one user-visible feature
3. Complete stories only when all acceptance criteria are met
4. Use descriptive filenames (e.g., `invoice-pdf-export.md`)

## Directory Structure

```
docs/user-stories/
├── backlog/       # Stories waiting to be worked on
├── active/        # Stories currently in development
├── completed/     # Archived completed stories
└── discarded/     # Stories that won't be implemented
```
