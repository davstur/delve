# Skills Reference

Detailed guidance for creating `.claude/skills/` entries. See the main SKILL.md
for the broader knowledge placement framework.

## What skills are

Skills are **on-demand knowledge** loaded when Claude detects matching user
intent. They're ideal for workflows, domain procedures, and complex
decision-making that doesn't need to be in context every session.

Custom commands (`.claude/commands/`) have been merged into skills. Both
`.claude/commands/review.md` and `.claude/skills/review/SKILL.md` create
`/review` and work the same way. Existing commands keep working, but skills are
the recommended path -- they support subdirectories, richer frontmatter, and
automatic loading.

## How loading works

Skills use a **progressive disclosure** model:

1. **Metadata** (~100 tokens): `name` and `description` are loaded at session
   start for all skills (subject to a character budget of ~2% of context window)
2. **Instructions** (<5000 tokens recommended): Full `SKILL.md` body loads when
   the skill is activated (by user or by Claude)
3. **Resources** (as needed): Supporting files (`scripts/`, `references/`,
   `assets/`) load only when the skill explicitly reads them

The description is the **trigger mechanism** -- Claude matches user intent
against it. The body is only loaded AFTER the skill triggers.

## Anatomy of a skill

```
.claude/skills/my-skill/
  SKILL.md              # Main file -- frontmatter + body (required)
  references/           # Additional docs loaded on demand
    detailed-guide.md
    examples.md
  scripts/              # Executable code Claude can run
    validate.sh
    helper.py
  assets/               # Static resources (templates, images, schemas)
    template.md
    config-schema.json
```

The three optional directories (`references/`, `scripts/`, `assets/`) are
defined by the Agent Skills spec. You can also create custom directories for
your domain (e.g. `themes/`, `examples/`, `agents/`) -- any files in the skill
directory can be referenced from SKILL.md.

### Where skills live

| Location   | Path                               | Applies to                     |
| ---------- | ---------------------------------- | ------------------------------ |
| Enterprise | Managed settings                   | All users in your organization |
| Personal   | `~/.claude/skills/<name>/SKILL.md` | All your projects              |
| Project    | `.claude/skills/<name>/SKILL.md`   | This project only              |
| Plugin     | `<plugin>/skills/<name>/SKILL.md`  | Where plugin is enabled        |

Priority: enterprise > personal > project. Plugin skills use namespacing
(`plugin-name:skill-name`) so they can't conflict.

**Monorepo discovery**: Claude auto-discovers skills from nested
`.claude/skills/` directories in subdirectories you're working in.

## Frontmatter fields

```yaml
---
name: my-skill-name # kebab-case, max 64 chars, must match directory name
description: > # CRITICAL -- this is the trigger (max 1024 chars)
  Use when the user asks to "do X", "create Y", or "handle Z". Include concrete
  trigger phrases and example scenarios.
user-invocable: false # false = hides from / menu, Claude can still invoke
disable-model-invocation: true # true = ONLY user can invoke, removes from Claude's context
allowed-tools: Read, Grep # Restrict tools available when skill is active
context: fork # Run in isolated subagent context
agent: Explore # Subagent type when context: fork (Explore, Plan, or custom)
model: claude-sonnet-4-5-20250514 # Override model for this skill
argument-hint: '[issue-number]' # Autocomplete hint for expected arguments
hooks: {} # Hooks scoped to skill lifecycle
---
```

All fields are optional. Only `description` is recommended.

### Description as trigger

The description is everything. Claude reads it to decide whether to load the
skill.

**Good description** -- includes trigger phrases and scenarios:

```yaml
description: >
  Use when the user asks to "write tests", "add integration tests", "fix failing
  test", or mentions test factories or test isolation. Provides testing patterns
  and isolation strategies.
```

**Bad description** -- vague, no trigger phrases:

```yaml
description: >
  Contains information about testing patterns used in the project.
```

### "When to use" belongs in description, not body

A common mistake: putting trigger conditions in the body. Claude only reads the
body AFTER deciding to load the skill, so "When to use" sections in the body
don't help with triggering.

### Invocation control

Two fields control who can invoke a skill. They serve different purposes:

| Frontmatter                      | `/` menu | Claude can invoke | Description in context |
| -------------------------------- | -------- | ----------------- | ---------------------- |
| (default)                        | Yes      | Yes               | Yes                    |
| `user-invocable: false`          | No       | Yes               | Yes                    |
| `disable-model-invocation: true` | Yes      | No                | No                     |

- **`user-invocable: false`**: Hides from the `/` menu but Claude still sees the
  description and can invoke it when relevant. Use for background knowledge
  (domain patterns, coding conventions).
- **`disable-model-invocation: true`**: Only the user can invoke it. Removes the
  description from Claude's context entirely. Use for workflows with side
  effects you want to control timing on (deploy, commit, send messages).

### Subagent execution with `context: fork`

Add `context: fork` to run the skill in an isolated subagent. The skill content
becomes the subagent's task prompt. It won't have access to conversation
history.

```yaml
---
name: deep-research
description: Research a topic thoroughly
context: fork
agent: Explore           # Built-in: Explore, Plan, general-purpose. Or custom agent name.
allowed-tools: Read, Grep, Glob
---

Research $ARGUMENTS thoroughly:
1. Find relevant files using Glob and Grep
2. Read and analyze the code
3. Summarize findings with specific file references
```

Only use `context: fork` for skills with explicit task instructions. A skill
containing only guidelines (no actionable task) will return without meaningful
output when forked.

### Tool restrictions with `allowed-tools`

Limit which tools Claude can use when a skill is active. Tools listed here are
granted without per-use approval:

```yaml
allowed-tools: Read, Grep, Glob           # Read-only mode
allowed-tools: Bash(git:*) Bash(jq:*) Read  # Git + jq only
```

## String substitutions

Skills support dynamic value substitution in the body content:

| Variable               | Description                                  |
| ---------------------- | -------------------------------------------- |
| `$ARGUMENTS`           | All arguments passed when invoking the skill |
| `$ARGUMENTS[N]` / `$N` | Access specific argument by 0-based index    |
| `${CLAUDE_SKILL_DIR}`  | Path to the skill's SKILL.md directory       |
| `${CLAUDE_SESSION_ID}` | Current session ID                           |

```yaml
---
name: fix-issue
description: Fix a GitHub issue
disable-model-invocation: true
---
Fix GitHub issue $ARGUMENTS following our coding standards.
```

If `$ARGUMENTS` isn't present in the content and arguments are passed, they're
appended as `ARGUMENTS: <value>`.

## Dynamic context injection

The `` !`command` `` syntax runs shell commands **before** the skill content
reaches Claude. The command output replaces the placeholder:

```yaml
---
name: pr-summary
description: Summarize changes in a pull request
context: fork
agent: Explore
---
## Pull request context
- PR diff: !`gh pr diff`
- Changed files: !`gh pr diff --name-only`

Summarize this pull request...
```

This is preprocessing -- Claude only sees the final rendered output, not the
commands.

## Body guidelines

- **SKILL.md target**: Under 500 lines. Use supporting directories for depth.
- **Structure**: Start with the core workflow or decision tree. Put details in
  reference files.
- **Actionable**: Skills should guide Claude through a process, not just
  describe concepts.
- **Self-contained enough**: The body should make sense without requiring Claude
  to read every reference file for the common case.

## Supporting directories

### `references/` -- documentation loaded on demand

Use when detailed docs, templates, or examples would bloat SKILL.md. Reference
from SKILL.md so Claude knows what's there and when to load it:

```markdown
For complete API details, see [reference.md](reference.md) For usage examples,
see [examples.md](examples.md)
```

### `scripts/` -- executable code

Scripts Claude can run during the skill workflow. Should be self-contained or
clearly document dependencies. Common languages: Python, Bash, JavaScript.

```yaml
# In SKILL.md:
Run the visualization script:
scripts/visualize.py $ARGUMENTS
```

Use `${CLAUDE_SKILL_DIR}` to reference scripts regardless of working directory:

```yaml
Run: ${CLAUDE_SKILL_DIR}/scripts/validate.sh
```

### `assets/` -- static resources

Templates, images, schemas, data files, configuration templates. Things Claude
reads but doesn't execute.

### Custom directories

Not limited to the three above. Create domain-appropriate directories:
`examples/`, `templates/`, `agents/`, `themes/`, `core/`. Just reference them
from SKILL.md so Claude knows they exist.

## Naming conventions

- **Skill directory**: kebab-case, descriptive (`knowledge-placement`,
  `test-patterns`, `browser-testing`)
- **Main file**: Always `SKILL.md`
- **Directory name must match `name` field** in frontmatter
- **Supporting files**: Descriptive names matching content (`rules.md`,
  `patterns.md`, `validate.py`)

## Creating new skills

When creating a new skill:

1. Pick a descriptive kebab-case directory name
2. Write the `description` field first -- test it by asking "would Claude load
   this when I say X?"
3. Start with SKILL.md under 200 lines; add supporting files as depth grows
4. Default to `user-invocable: false` unless it's an explicit user action
5. Consider `context: fork` for research or read-only analysis skills
6. Use `disable-model-invocation: true` for skills with side effects (deploy,
   commit, send)

## Anti-patterns

- **Description too vague**: "Helps with database stuff" won't trigger reliably.
  Include specific phrases users actually say.
- **Body too long**: If SKILL.md exceeds 500 lines, split into supporting files.
  Long bodies cost tokens every time the skill loads.
- **Trigger conditions in body**: "When to use this skill" in the body is
  invisible to the trigger mechanism. Put it in the description.
- **Duplicating rules**: If the knowledge is a concise checklist that should
  load while editing specific files, it's a rule, not a skill.
- **No supporting files for complex topics**: Cramming everything into SKILL.md
  makes it hard to maintain and expensive to load.
- **Confusing invocation controls**: `user-invocable: false` still lets Claude
  invoke it. Use `disable-model-invocation: true` to actually prevent Claude
  from triggering the skill.
- **`context: fork` without a task**: A forked skill with only guidelines and no
  actionable instructions returns nothing useful. Fork needs a concrete task.
